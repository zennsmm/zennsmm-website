"use client";

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Wallet, CreditCard, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AddFundsPage() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  // MANDATORY ROUTE PROTECTION
  useEffect(() => {
    if (!authLoading && !user) {
      toast({ 
        title: "Access Denied", 
        description: "Please sign in to access this feature.", 
        variant: "destructive" 
      });
      router.replace('/login');
    }
  }, [user, authLoading, router, toast]);

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    
    const val = parseFloat(amount);
    if (isNaN(val) || val < 5) {
      toast({ title: "Check Amount", description: "Please enter at least $5.", variant: "destructive" });
      return;
    }

    setLoading(true);
    
    // Simulate Payment Success
    setTimeout(async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        
        await updateDoc(userRef, {
          balance: increment(val)
        });

        await addDoc(collection(db, 'transactions'), {
          userId: user.uid,
          amount: val,
          paymentMethod: 'Stripe/Cards',
          status: 'success',
          createdAt: serverTimestamp()
        });

        toast({ title: "Funds Added!", description: `$${val} is now in your balance.` });
        router.push('/dashboard');
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Add <span className="text-primary">Funds</span></h1>
        <p className="text-sm text-muted-foreground">Top up your account balance using USD.</p>
      </div>

      <div className="space-y-8">
        <Card className="bg-white border-slate-100 shadow-2xl rounded-[2rem] overflow-hidden">
          <CardHeader className="p-8 bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white shadow-sm">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Secure Payment</CardTitle>
                <CardDescription className="text-xs">Cards, Crypto, and Global Methods</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <form onSubmit={handleAddFunds} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground opacity-70">Amount (USD)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-300">$</span>
                  <Input 
                    type="number"
                    placeholder="Min. 5" 
                    className="pl-10 h-14 text-lg bg-slate-50 border-transparent font-bold focus-visible:ring-primary/20"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground/60 italic">Funds are added instantly to your balance.</p>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {[10, 25, 50, 100].map(val => (
                  <Button 
                    key={val} 
                    type="button"
                    variant="outline" 
                    size="sm" 
                    className="h-10 text-xs font-bold rounded-xl border-slate-100 hover:border-primary/30 hover:bg-primary/5"
                    onClick={() => setAmount(val.toString())}
                  >
                    ${val}
                  </Button>
                ))}
              </div>

              <Button className="w-full h-14 text-base font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="flex items-center gap-2">Proceed to Checkout <ArrowRight className="h-4 w-4" /></span>}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="p-6 bg-slate-50/30 flex items-center justify-center gap-4 border-t border-slate-100">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">100% Secure SSL Payment</span>
          </CardFooter>
        </Card>

        <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10 flex items-start gap-6">
          <div className="bg-white p-3 rounded-2xl shadow-sm">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-bold">Safe & Instant</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Once added, your funds can be used to buy any service on ZennSMM. 
              Our billing system is fully automated and secure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
