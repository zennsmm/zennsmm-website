"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

const ADMIN_UID = 'V7eWB7Evyuetam8yOJfG2aaDvtO2';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    
    setLoading(true);
    setError(null);

    try {
      console.log(`[AdminLogin] Attempting sign in for: ${email}`);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Verify Authorization
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const profile = userDoc.data();
      const isAdmin = user.uid === ADMIN_UID || profile?.role === 'admin';

      if (!isAdmin) {
        await signOut(auth);
        setError("Access Denied - Admin Only");
        toast({ 
          title: "Unauthorized", 
          description: "This portal is for authorized personnel only.", 
          variant: "destructive" 
        });
        return;
      }

      toast({ title: "Authorized", description: "Admin session initiated." });
      router.replace('/admin');
    } catch (err: any) {
      setError("Invalid admin credentials.");
      toast({ 
        title: "Login Failed", 
        description: "Please check your admin credentials.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4">
      <div className="mb-8 text-center">
        <div className="flex items-center gap-2 justify-center mb-2">
          <div className="p-2 rounded-xl bg-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">ZennSMM</h1>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground opacity-60">Control Infrastructure</p>
      </div>

      <Card className="w-full max-w-md bg-white shadow-2xl rounded-[2.5rem] border-slate-100 overflow-hidden">
        <CardHeader className="text-center p-8 bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
          <CardDescription className="text-xs font-bold text-muted-foreground">Authorized Personnel Only</CardDescription>
        </CardHeader>
        
        <CardContent className="p-8">
          {error && (
            <div className="p-4 mb-6 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <p className="text-xs text-red-700 font-bold uppercase tracking-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Admin Email</Label>
              <Input 
                type="email" 
                placeholder="admin@zennsmm.com" 
                className="h-12 bg-slate-50 border-transparent focus:bg-white font-bold" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Admin Password</Label>
              <PasswordInput 
                placeholder="••••••••" 
                className="h-12 bg-slate-50 border-transparent focus:bg-white font-bold" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button className="w-full font-extrabold h-14 text-sm bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Login to Admin Panel"}
            </Button>
          </form>
        </CardContent>
        <div className="p-6 bg-slate-50/30 border-t border-slate-100 text-center">
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-none">Protected by Advanced Encryption</p>
        </div>
      </Card>
      
      <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
        System Node: 242236684-14aa9
      </p>
    </div>
  );
}
