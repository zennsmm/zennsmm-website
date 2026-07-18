"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  Menu, 
  Zap
} from 'lucide-react';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';

const SidebarContent = dynamic(() => import('./SidebarContent'), {
  loading: () => <div className="p-8"><div className="h-8 w-full bg-slate-100 animate-pulse rounded-xl" /></div>
});

const BrandLogo = ({ className = "h-12 w-12" }: { className?: string }) => (
  <div className={cn(
    "relative overflow-hidden bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center rounded-full transition-shadow duration-500",
    "shadow-[0_0_12px_rgba(168,85,247,0.9),0_0_24px_rgba(168,85,247,0.7),0_0_40px_rgba(168,85,247,0.5)]",
    "border border-white/20",
    className
  )}>
    <img 
      src="https://pdftourl.net/images/1781555709150-54f47441-c895-44f4-b71c-11b5ae082e44.jpg" 
      alt="ZennSMM Logo" 
      className="h-full w-full object-cover" 
    />
    <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-transparent pointer-events-none" />
    <div className="absolute inset-0 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)] pointer-events-none" />
  </div>
);

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMenu = useCallback(() => setIsOpen(prev => !prev), []);
  const closeMenu = useCallback(() => setIsOpen(false), []);

  if (!mounted) return (
    <nav className="sticky top-0 z-[100] w-full border-b bg-white h-16 flex items-center px-4">
      <BrandLogo className="h-9 w-9 mr-2" />
      <span className="font-black text-xl tracking-[-0.03em]">ZennSMM</span>
    </nav>
  );

  return (
    <>
      <nav className="sticky top-0 z-[100] w-full border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleMenu}
              className="p-2 -ml-2 rounded-xl hover:bg-slate-50 transition-colors"
              aria-label="Open Menu"
            >
              <Menu className="h-6 w-6 text-[#111827]" />
            </button>
            <Link href="/" className="flex items-center gap-3 group">
              <BrandLogo className="h-10 w-10 sm:h-11 sm:w-11" />
              <span className="text-xl sm:text-2xl font-black tracking-[-0.03em] text-[#111827] font-sans">ZennSMM</span>
            </Link>
          </div>
          {user && (
            <Link href="/dashboard" className="hidden sm:flex items-center gap-2 text-[11px] font-black text-primary bg-primary/5 px-5 py-2.5 rounded-full border border-primary/10 uppercase tracking-wider">
              <Zap className="h-3.5 w-3.5" /> Dashboard
            </Link>
          )}
        </div>
      </nav>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99998]"
          onClick={closeMenu}
        />
      )}

      <aside 
        className={cn(
          "fixed top-0 left-0 w-[280px] h-full bg-white z-[99999] shadow-2xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent isOpen={isOpen} closeMenu={closeMenu} user={user} pathname={pathname} />
      </aside>
    </>
  );
};

export default Navbar;