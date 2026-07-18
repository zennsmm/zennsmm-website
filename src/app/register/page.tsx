
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  createUserWithEmailAndPassword, 
  updateProfile,
  getRedirectResult
} from 'firebase/auth';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { handlePostSignIn } from '@/firebase/auth/google-auth';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Loader2, ShieldAlert } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);

  const auth = useAuth();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!auth || !db) return;

    const resolveHandshake = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          await handlePostSignIn(db, result.user);
          return;
        }
      } catch (err: any) {
        console.error('[Register] Auth Error:', err.message);
      } finally {
        setIsProcessingRedirect(false);
      }
    };

    resolveHandshake();
  }, [auth, db]);

  useEffect(() => {
    if (!authLoading && !isProcessingRedirect && user) {
      router.replace('/order');
    }
  }, [user, authLoading, isProcessingRedirect, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });
      await handlePostSignIn(db, user);

      toast({ title: "Welcome to ZennSMM!", description: "Account created successfully." });
    } catch (error: any) {
      toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
      setLoading(false);
    }
  };

  if (authLoading || isProcessingRedirect) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Configuring session...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4 py-10">
      <Card className="w-full max-w-sm bg-white border border-slate-200/80 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_30px_60px_-15px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,1)] rounded-[2.25rem] overflow-hidden transform hover:scale-[1.005] transition-all duration-500 ease-out">
        <CardHeader className="text-center p-8 bg-slate-50/50 border-b border-slate-100/80">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-[1.25rem] flex items-center justify-center mb-4 shadow-sm border border-primary/5">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black uppercase tracking-tight text-[#111827]">Join ZennSMM</CardTitle>
          <CardDescription className="text-[10px] uppercase tracking-[0.25em] font-black opacity-40">Initialize Identity</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pb-6">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black text-[#111827] tracking-widest ml-1 opacity-70">Full Name</Label>
              <Input 
                placeholder="John Doe" 
                className="h-11 bg-slate-50/50 border-transparent focus:bg-white focus:ring-4 focus:ring-primary/5 font-bold text-sm rounded-xl transition-all" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black text-[#111827] tracking-widest ml-1 opacity-70">Email Address</Label>
              <Input 
                type="email" 
                placeholder="john@example.com" 
                className="h-11 bg-slate-50/50 border-transparent focus:bg-white focus:ring-4 focus:ring-primary/5 font-bold text-sm rounded-xl transition-all" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black text-[#111827] tracking-widest ml-1 opacity-70">Password</Label>
              <PasswordInput 
                placeholder="••••••••" 
                className="h-11 bg-slate-50/50 border-transparent focus:bg-white focus:ring-4 focus:ring-primary/5 font-bold text-sm rounded-xl transition-all" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-start space-x-2.5 pt-2">
              <Checkbox id="terms" className="mt-1 h-4 w-4 rounded-md border-slate-300" required />
              <label htmlFor="terms" className="text-[10px] text-slate-500 leading-snug font-bold uppercase tracking-wider">
                I agree to the <Link href="/terms" className="text-primary font-black hover:underline">Terms</Link> and <Link href="/privacy" className="text-primary font-black hover:underline">Privacy</Link>.
              </label>
            </div>
            <Button className="w-full font-black h-12 text-xs bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-[1rem] transition-all hover:-translate-y-0.5 active:translate-y-0 mt-2" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create My Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t border-slate-100/80 p-6 bg-slate-50/30">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Already have an account? <Link href="/login" className="text-primary hover:underline font-black ml-1">Sign In Here</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
