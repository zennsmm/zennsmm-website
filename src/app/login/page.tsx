
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  signInWithEmailAndPassword,
  getRedirectResult
} from 'firebase/auth';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { handlePostSignIn } from '@/firebase/auth/google-auth';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Loader2, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
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
        console.error('[Login] OAuth Error:', err.message);
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Ensure identity and roles are synchronized on successful login
      await handlePostSignIn(db, userCredential.user);
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  if (authLoading || isProcessingRedirect) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Verifying Authentication...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4 py-6">
      <Card className="w-full max-w-sm bg-white border border-slate-200/80 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_25px_60px_-15px_rgba(0,0,0,0.18),inset_0_1px_1px_rgba(255,255,255,1)] rounded-[2rem] overflow-hidden transform hover:scale-[1.005] transition-all duration-500 ease-out">
        <CardHeader className="text-center p-6 bg-slate-50/50 border-b border-slate-100/80">
          <div className="mx-auto w-11 h-11 bg-primary/10 rounded-[1.25rem] flex items-center justify-center mb-3 shadow-sm border border-primary/5">
            <LogIn className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl font-black uppercase tracking-tight text-[#111827]">Sign In</CardTitle>
          <CardDescription className="text-[10px] uppercase tracking-[0.25em] font-black opacity-40">Identity Gateway</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pb-5">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black text-[#111827] tracking-widest ml-1 opacity-70">Email Address</Label>
              <Input type="email" placeholder="user@example.com" className="h-11 bg-slate-50/50 border-transparent focus:bg-white focus:ring-4 focus:ring-primary/5 font-bold text-sm rounded-xl transition-all" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black text-[#111827] tracking-widest ml-1 opacity-70">Password</Label>
              <PasswordInput placeholder="••••••••" className="h-11 bg-slate-50/50 border-transparent focus:bg-white focus:ring-4 focus:ring-primary/5 font-bold text-sm rounded-xl transition-all" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button className="w-full font-black h-12 text-xs bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-[1rem] transition-all hover:-translate-y-0.5 active:translate-y-0 mt-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Authorize Session"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t border-slate-100/80 p-5 bg-slate-50/30">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            New to ZennSMM? <Link href="/register" className="text-primary hover:underline font-black ml-1">Create Account</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
