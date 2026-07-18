"use client";

import Link from 'next/link';
import { 
  Home, 
  Zap, 
  Layers, 
  ShoppingBag, 
  PlusCircle, 
  Users, 
  Code2, 
  Headphones, 
  Settings, 
  User, 
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Home', href: '/', icon: Home, public: true },
  { label: 'New Order', href: '/order', icon: Zap, public: false },
  { label: 'Services', href: '/services', icon: Layers, public: true },
  { label: 'My Orders', href: '/orders', icon: ShoppingBag, public: false },
  { label: 'Add Funds', href: '/add-funds', icon: PlusCircle, public: false },
  { label: 'Affiliate', href: '/affiliate', icon: Users, public: false },
  { label: 'API Docs', href: '/api-docs', icon: Code2, public: false },
  { label: 'Support', href: '/contact', icon: Headphones, public: true },
  { label: 'Settings', href: '/settings', icon: Settings, public: false },
];

const BrandLogo = ({ className = "h-11 w-11" }: { className?: string }) => (
  <div className={cn(
    "relative overflow-hidden bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center rounded-full transition-shadow duration-500",
    "shadow-[0_0_12px_rgba(168,85,247,0.9),0_0_24px_rgba(168,85,247,0.7),0_0_40px_rgba(168,85,247,0.5)]",
    "border border-white/20",
    className
  )}>
    <img 
      src="https://pdftourl.net/images/1781555709150-54f47441-c895-44f4-b71c-11b5ae082e44.jpg" 
      alt="Logo" 
      className="h-full w-full object-cover" 
    />
    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent pointer-events-none" />
  </div>
);

export default function SidebarContent({ closeMenu, user, pathname }: any) {
  const auth = useAuth();
  
  const handleLogout = async () => {
    if (auth) await signOut(auth);
    closeMenu();
  };

  const filteredLinks = navLinks.filter(link => user ? true : link.public);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-20 px-5 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo />
          <span className="font-black text-xl tracking-[-0.03em] text-[#111827]">ZennSMM</span>
        </div>
        <button onClick={closeMenu} className="p-2 rounded-full hover:bg-slate-50">
          <X className="h-5 w-5 text-slate-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {filteredLinks.map((link) => (
          <Link 
            key={link.href} 
            href={link.href} 
            onClick={closeMenu}
            className={cn(
              "flex items-center gap-3 px-4 h-12 rounded-xl text-[15px] font-bold transition-all",
              pathname === link.href ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <link.icon className="h-[18px] w-[18px]" />
            <span className="text-sm font-bold min-w-0 break-words leading-tight">{link.label}</span>
          </Link>
        ))}
      </div>

      <div className="p-4 border-t bg-slate-50/50">
        {!user ? (
          <div className="grid gap-2">
            <Link href="/login" onClick={closeMenu} className="w-full">
              <Button variant="outline" className="w-full h-11 font-bold rounded-xl">Login</Button>
            </Link>
            <Link href="/register" onClick={closeMenu} className="w-full">
              <Button className="w-full h-11 font-bold rounded-xl">Register</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <Link href="/profile" onClick={closeMenu} className="flex items-center gap-3 p-3 bg-white rounded-xl border">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold truncate min-w-0 max-w-[160px]">{user?.email || 'My Account'}</span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold">View Profile</span>
              </div>
            </Link>
            <Button onClick={handleLogout} variant="ghost" className="w-full h-11 font-bold text-red-500 rounded-xl">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
