"use client";

import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { 
  Loader2, 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Layers, 
  Server, 
  CreditCard, 
  MessageSquare, 
  Zap, 
  Activity, 
  Settings, 
  Menu, 
  X,
  ShieldCheck,
  LogOut,
  KeyRound
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Root as VisuallyHidden } from "@radix-ui/react-visually-hidden";

const ADMIN_UID = 'V7eWB7Evyuetam8yOJfG2aaDvtO2';
const TIMEOUT_MS = 6000;

const NAV_LINKS = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { label: 'User Base', href: '/admin/users', icon: Users },
  { label: 'Pass Resets', href: '/admin/password-resets', icon: KeyRound },
  { label: 'Services', href: '/admin/services', icon: Layers },
  { label: 'Providers', href: '/admin/providers', icon: Server },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard },
  { label: 'Support', href: '/admin/tickets', icon: MessageSquare },
  { label: 'Automation', href: '/admin/automation', icon: Zap },
  { label: 'Audit Trail', href: '/admin/activity', icon: Activity },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const [timedOut, setTimedOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userDocRef = useMemo(
    () => (user && db ? doc(db, 'users', user.uid) : null),
    [user, db]
  );
  const { data: profile, loading: profileLoading } = useDoc(userDocRef);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) return;
    const timer = setTimeout(() => {
      console.warn("[AdminLayout] Authorization watchdog triggered");
      setTimedOut(true);
    }, TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isLoginPage]);

  useEffect(() => {
    if (isLoginPage || authLoading) return;

    if (!user) {
      console.log("[AdminLayout] Unauthenticated, routing to login");
      router.replace('/admin/login');
      return;
    }

    const profileReady = !profileLoading || timedOut;
    if (!profileReady) return;

    const isAdmin = user.uid === ADMIN_UID || profile?.role === 'admin';
    
    if (!isAdmin) {
      console.warn("[AdminLayout] UID mismatch or role unauthorized. UID:", user.uid, "Role:", profile?.role);
      router.replace('/login');
    } else {
      console.log("[AdminLayout] Access confirmed for:", user.email);
    }
  }, [user, profile, authLoading, profileLoading, timedOut, router, isLoginPage]);

  if (isLoginPage) return <>{children}</>;

  const stillChecking = (authLoading || profileLoading) && !timedOut;

  if (stillChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Authorizing Terminal...</p>
      </div>
    );
  }

  const finalAdminCheck = user && (user.uid === ADMIN_UID || profile?.role === 'admin' || timedOut);
  if (!finalAdminCheck) return null;

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden">
      <div className={cn("border-b border-white/5", isMobile ? "p-6" : "p-8")}>
        <div className="flex items-center gap-3">
          <div className={cn("bg-primary rounded-xl shrink-0", isMobile ? "p-1.5" : "p-2")}>
            <ShieldCheck className={cn("text-white", isMobile ? "h-5 w-5" : "h-6 w-6")} />
          </div>
          <div className="min-w-0">
            <h1 className={cn("font-black tracking-tight truncate", isMobile ? "text-base" : "text-lg")}>ZennSMM</h1>
            <p className="text-[8px] font-black uppercase tracking-widest text-primary truncate">Control Infra</p>
          </div>
        </div>
      </div>
      <nav className={cn(
        "flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-1 no-scrollbar",
        !isMobile && "p-6 space-y-1.5"
      )}>
        {NAV_LINKS.map((link) => (
          <Link 
            key={link.href} 
            href={link.href}
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 rounded-xl transition-all duration-200 group flex-safe",
              isMobile ? "h-10" : "h-12",
              pathname === link.href ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <link.icon className={cn(isMobile ? "h-3.5 w-3.5" : "h-4 w-4", pathname === link.href ? "text-white" : "text-slate-500 group-hover:text-white")} />
            <span className="text-[11px] font-black uppercase tracking-widest admin-nav-label flex-1">{link.label}</span>
          </Link>
        ))}
      </nav>
      <div className={cn("border-t border-white/5", isMobile ? "p-4" : "p-6")}>
        <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between gap-2 overflow-hidden">
          <div className="min-w-0 flex-1">
            <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Authorized As</p>
            <p className="text-[11px] font-bold sidebar-email">{user?.email}</p>
          </div>
          <button 
            onClick={() => router.push('/dashboard')} 
            className="p-2 text-slate-400 hover:text-white shrink-0"
            aria-label="Logout to User Panel"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-x-hidden">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:block w-72 h-screen sticky top-0 border-r border-slate-100 overflow-hidden shrink-0">
        <SidebarContent />
      </aside>

      {/* MOBILE HEADER */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
        <header className="lg:hidden h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-40 shrink-0">
           <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
            <span className="font-black text-sm uppercase tracking-tight truncate">Admin Terminal</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(true)} 
            className="p-2 bg-slate-50 rounded-lg shrink-0"
            aria-label="Open Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main className="p-4 md:p-10 max-w-full overflow-x-hidden overflow-y-auto">
          <div className="max-w-6xl mx-auto w-full animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>

      {/* MOBILE DRAWER */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-[75vw] max-w-[280px] border-0 bg-slate-950">
          <VisuallyHidden>
            <SheetTitle>Admin Navigation</SheetTitle>
            <SheetDescription>Main administrative navigation links</SheetDescription>
          </VisuallyHidden>
          <SidebarContent isMobile />
        </SheetContent>
      </Sheet>
    </div>
  );
}