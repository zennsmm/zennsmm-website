"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getRedirectResult } from 'firebase/auth';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { handlePostSignIn } from '@/firebase/auth/google-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Zap, 
  UserPlus,
  LogIn,
  Loader2,
  LayoutDashboard,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Headphones,
  Users,
  ShoppingBag,
  Star,
  Timer,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import ForgotPassword from "@/components/ForgotPassword";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";

const getFriendlyErrorMessage = (code: string) => {
  switch (code) {
    case 'auth/user-not-found':
      return "❌ No account found with this email address.";
    case 'auth/wrong-password':
      return "❌ Incorrect password. Please try again.";
    case 'auth/invalid-credential':
      return "❌ Invalid email or password. Please try again.";
    case 'auth/invalid-email':
      return "❌ Please enter a valid email address.";
    case 'auth/user-disabled':
      return "❌ This account has been disabled. Contact support.";
    case 'auth/too-many-requests':
      return "❌ Too many login attempts. Please wait and try again later.";
    case 'auth/network-request-failed':
      return "❌ Connection problem. Please check your internet and try again.";
    case 'auth/email-already-in-use':
      return "❌ This email is already registered.";
    case 'auth/internal-error':
      return "❌ Please enter both email and password.";
    default:
      return "❌ Login failed. Please try again.";
  }
};

export default function Home() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);
  
  const [authError, setAuthError] = useState<{ 
    code: string; 
    message: string; 
  } | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !auth || !db) return;

    const resolveHandshake = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          await handlePostSignIn(db, result.user);
          return;
        }
      } catch (err: any) {
        if (err.code !== 'auth/no-current-user') {
          setAuthError({ code: err.code, message: err.message });
        }
      } finally {
        setIsProcessingRedirect(false);
      }
    };

    resolveHandshake();
  }, [mounted, auth, db]);

  useEffect(() => {
    if (mounted && !authLoading && !isProcessingRedirect && user) {
      router.replace('/order');
    }
  }, [user, authLoading, isProcessingRedirect, router, mounted]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    setAuthError(null);

    if (authView === 'register' && password !== confirmPassword) {
      toast({ title: "Passwords Mismatch", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    if (!email.trim() || !password.trim()) {
      setAuthError({ code: 'auth/internal-error', message: '' });
      return;
    }

    setLoading(true);
    try {
      if (authView === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await handlePostSignIn(db, userCredential.user);
      }
    } catch (err: any) {
      setAuthError({ code: err.code, message: err.message });
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO & AUTH SECTION */}
      <section className="relative py-12 lg:py-24 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(147,51,234,0.05),transparent)]">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            
            <div className="text-center lg:text-left space-y-6">
              <Badge variant="secondary" className="text-xs h-7 px-4 border-primary/10 bg-primary/5 text-primary font-bold">Trusted by 15,000+ Users</Badge>
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">Grow Your Social <span className="gradient-text">Media Faster</span></h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">The most reliable SMM platform to boost your followers, likes, and engagement in seconds.</p>
            </div>

            <div className="w-full flex justify-center">
              {(authLoading || isProcessingRedirect) ? (
                <Card className="w-full max-w-md bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] rounded-[2.5rem] border border-slate-200/80 flex flex-col items-center justify-center p-20 min-h-[400px]">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Synchronizing Session...</p>
                </Card>
              ) : user ? (
                <Card className="w-full max-w-md bg-white shadow-[0_25px_60px_-12px_rgba(0,0,0,0.1)] rounded-[2.5rem] border border-slate-200/80 overflow-hidden text-center p-12 min-h-[350px] flex flex-col justify-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-sm border border-primary/5">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-black mb-2 text-[#111827]">Authenticated</h2>
                  <p className="text-slate-500 font-bold mb-8 text-sm">Welcome back,<br/><span className="text-primary font-black uppercase tracking-wide">{user.email}</span></p>
                  <Link href="/order" className="w-full">
                    <Button className="w-full h-14 text-lg font-black bg-primary shadow-xl shadow-primary/20 rounded-[1.25rem] group transition-all hover:-translate-y-1">
                      Open Dashboard <LayoutDashboard className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </Card>
              ) : authView === 'forgot' ? (
                <ForgotPassword onBack={() => setAuthView('login')} />
              ) : (
                <Card className="w-full max-w-sm bg-white/95 backdrop-blur-sm border border-slate-200/80 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_35px_70px_-12px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,1)] rounded-[2.25rem] overflow-hidden transition-all duration-500 ease-out transform hover:scale-[1.005]">
                  <CardHeader className="text-center p-6 bg-slate-50/50 border-b border-slate-100/80">
                    <div className="mx-auto w-11 h-11 bg-primary/10 rounded-[1.25rem] flex items-center justify-center mb-3 shadow-sm border border-primary/5">
                      {authView === 'login' ? <LogIn className="h-5 w-5 text-primary" /> : <UserPlus className="h-5 w-5 text-primary" />}
                    </div>
                    <CardTitle className="text-xl font-black uppercase tracking-tight text-[#111827]">{authView === 'login' ? 'WELCOME BACK' : 'CREATE ACCOUNT'}</CardTitle>
                    <CardDescription className="text-[10px] uppercase tracking-[0.25em] font-black opacity-40">{authView === 'login' ? 'Secure Entry' : 'Join ZennSMM Network'}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    
                    {authError && (
                      <div className="p-3.5 rounded-2xl bg-red-50/80 border border-red-100 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-300">
                        <ShieldAlert className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] font-bold text-red-600 leading-tight">
                          {getFriendlyErrorMessage(authError.code)}
                        </p>
                      </div>
                    )}

                    <form onSubmit={handleEmailAuth} className="space-y-4">
                      {authView === 'register' && (
                        <div className="space-y-1.5">
                          <Label className="text-[10px] uppercase font-black text-[#111827] tracking-widest ml-1 opacity-70">Full Name</Label>
                          <Input placeholder="John Doe" className="h-11 bg-slate-50/50 border-transparent focus:bg-white focus:ring-4 focus:ring-primary/5 font-bold text-sm rounded-xl transition-all" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-black text-[#111827] tracking-widest ml-1 opacity-70">Email Address</Label>
                        <Input type="email" placeholder="user@example.com" className="h-11 bg-slate-50/50 border-transparent focus:bg-white focus:ring-4 focus:ring-primary/5 font-bold text-sm rounded-xl transition-all" value={email} onChange={(e) => setEmail(e.target.value)} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-black text-[#111827] tracking-widest ml-1 opacity-70">Password</Label>
                        <PasswordInput placeholder="••••••••" className="h-11 bg-slate-50/50 border-transparent focus:bg-white focus:ring-4 focus:ring-primary/5 font-bold text-sm rounded-xl transition-all" value={password} onChange={(e) => setPassword(e.target.value)} required />
                      </div>

                      {authView === 'login' && (
                        <div className="flex justify-end -mt-2">
                          <button 
                            type="button"
                            onClick={() => setAuthView('forgot')}
                            className="text-[9px] font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-widest"
                          >
                            Forgot Password?
                          </button>
                        </div>
                      )}

                      {authView === 'register' && (
                        <div className="space-y-1.5">
                          <Label className="text-[10px] uppercase font-black text-[#111827] tracking-widest ml-1 opacity-70">Confirm Password</Label>
                          <PasswordInput placeholder="••••••••" className="h-11 bg-slate-50/50 border-transparent focus:bg-white focus:ring-4 focus:ring-primary/5 font-bold text-sm rounded-xl transition-all" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                        </div>
                      )}
                      <Button className="w-full font-black h-12 text-xs bg-primary shadow-xl shadow-primary/20 rounded-[1rem] transition-all hover:-translate-y-0.5 active:translate-y-0 mt-2" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (authView === 'login' ? 'Authorize & Login' : 'Create My Account')}
                      </Button>
                    </form>
                  </CardContent>
                  <CardFooter className="justify-center border-t border-slate-100/80 p-5 bg-slate-50/30">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {authView === 'login' ? "New Here?" : "Already a member?"}{' '}
                      <button onClick={() => setAuthView(authView === 'login' ? 'register' : 'login')} className="text-primary hover:underline font-black ml-1">
                        {authView === 'login' ? 'Create Account' : 'Sign In Instead'}
                      </button>
                    </p>
                  </CardFooter>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE ZENN SMM - COMPACT GRID */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-8 space-y-1">
            <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Core Advantages</h2>
            <p className="text-2xl font-black text-[#111827] tracking-tight">Why Choose <span className="text-primary">ZennSMM?</span></p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { title: "Fast Delivery", desc: "Results in minutes.", icon: Zap },
              { title: "Secure Payment", desc: "100% safe checkout.", icon: ShieldCheck },
              { title: "High Quality", desc: "Real growth that sticks.", icon: TrendingUp },
              { title: "24/7 Support", desc: "Expert help anytime.", icon: Headphones }
            ].map((item, idx) => (
              <Card key={idx} className="border-slate-100 shadow-sm rounded-2xl hover:shadow-md transition-all duration-300">
                <CardContent className="p-4 text-center space-y-2">
                  <div className="mx-auto w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-[#111827]">{item.title}</h3>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* STATISTICS SECTION */}
      <section className="py-12 bg-primary/5 border-y border-primary/10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: "15,000+", label: "Users", icon: Users },
              { value: "500,000+", label: "Orders", icon: ShoppingBag },
              { value: "99%", label: "Satisfaction", icon: Star },
              { value: "Instant", label: "Delivery", icon: Timer }
            ].map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center text-center space-y-1">
                <stat.icon className="h-5 w-5 text-primary mb-1" />
                <p className="text-xl sm:text-2xl font-black text-[#111827] tracking-tight">{stat.value}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS - COMPACT HORIZONTAL CAROUSEL */}
      <section className="py-16 bg-slate-50/50 overflow-hidden">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-[#111827] mb-2">How It <span className="text-primary">Works</span></h2>
            <p className="text-xs text-slate-500 font-medium">Simple steps to skyrocket your presence.</p>
          </div>
          
          <div className="flex overflow-x-auto pb-4 gap-4 snap-x snap-mandatory no-scrollbar md:grid md:grid-cols-4 md:overflow-visible">
            {[
              { step: "01", title: "Select Service", desc: "Choose your package." },
              { step: "02", title: "Enter Link", desc: "Provide profile URL." },
              { step: "03", title: "Pay", desc: "Secure checkout." },
              { step: "04", title: "Get Delivery", desc: "Watch the growth." }
            ].map((step, idx) => (
              <div key={idx} className="min-w-[160px] snap-center text-center space-y-3 relative group">
                <div className="mx-auto w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm shadow-md shadow-primary/20">
                  {step.step}
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-[#111827] text-sm">{step.title}</h4>
                  <p className="text-[11px] text-slate-500 font-medium px-2">{step.desc}</p>
                </div>
                {idx < 3 && <div className="hidden md:block absolute top-5 -right-4 w-8 border-t-2 border-dashed border-slate-200" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CUSTOMER REVIEWS - COMPACT ONE-AT-A-TIME CAROUSEL */}
      <section className="py-16 bg-white overflow-hidden">
        <div className="container mx-auto px-4 max-w-lg">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-[#111827]">Customer <span className="text-primary">Reviews</span></h2>
          </div>
          
          <div className="flex overflow-x-auto gap-4 snap-x snap-mandatory no-scrollbar pb-2">
            {[
              { name: "David L.", role: "Influencer", text: "ZennSMM is my go-to. The speed and quality are unmatched by any other panel I've used." },
              { name: "Sarah M.", role: "Store Owner", text: "The TikTok followers were high quality and really helped build trust for my new brand." },
              { name: "James K.", role: "YouTuber", text: "Finally found a reliable source for YouTube. My views started coming in within 30 minutes." }
            ].map((rev, idx) => (
              <Card key={idx} className="min-w-full snap-center border-slate-100 rounded-2xl p-6 shadow-sm">
                <div className="flex gap-0.5 mb-3 text-orange-400">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                </div>
                <p className="text-xs text-slate-600 italic leading-relaxed mb-4">"{rev.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center font-black text-[10px] text-primary">
                    {rev.name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-black text-[#111827]">{rev.name}</p>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">{rev.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-16 bg-slate-50/50">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-[#111827] mb-2">Got <span className="text-primary">Questions?</span></h2>
            <p className="text-xs text-slate-500 font-medium">Everything you need to know about ZennSMM.</p>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {[
              { q: "Is my account safe with ZennSMM?", a: "Absolutely. We only require public links. We never ask for your password or sensitive account details." },
              { q: "How fast is the delivery?", a: "Most orders start instantly or within 0-60 minutes. Completion time depends on the quantity and service speed." },
              { q: "Do you provide customer support?", a: "Yes, our support team is available 24/7 via WhatsApp and our internal ticketing system." },
              { q: "Are payments secure?", a: "All transactions are processed through SSL-encrypted, globally recognized payment gateways." }
            ].map((item, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="bg-white border border-slate-100 px-5 rounded-2xl overflow-hidden">
                <AccordionTrigger className="text-left font-black text-sm text-[#111827] hover:no-underline py-4">{item.q}</AccordionTrigger>
                <AccordionContent className="text-xs text-slate-500 font-medium pb-4 leading-relaxed">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA BANNER - COMPACT GRADIENT BOX */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="relative bg-gradient-to-br from-[#7C3AED] to-[#A855F7] rounded-[2rem] p-8 md:p-12 text-center overflow-hidden shadow-xl shadow-primary/20 group">
            <div className="relative z-10 space-y-6">
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Start Growing Today</h2>
              <p className="text-white/80 font-medium max-w-md mx-auto text-xs md:text-sm">Join thousands of users boosting their presence with ZennSMM's premium services.</p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href={user ? "/order" : "/register"}>
                  <Button className="h-12 px-10 bg-white text-primary hover:bg-slate-50 font-black uppercase tracking-widest text-[11px] rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="ghost" className="h-12 px-8 text-white hover:bg-white/10 font-black uppercase tracking-widest text-[10px] border border-white/20 rounded-xl">
                    <MessageSquare className="mr-2 h-4 w-4" /> Contact Support
                  </Button>
                </Link>
              </div>
            </div>
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[60px] -mr-24 -mt-24" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-[60px] -ml-24 -mb-24" />
          </div>
        </div>
      </section>
    </div>
  );
}
