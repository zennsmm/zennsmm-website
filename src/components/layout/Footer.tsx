"use client";

import Link from 'next/link';
import { Mail, ShieldCheck, HelpCircle } from 'lucide-react';
import { useUser } from '@/firebase';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const BrandLogo = ({ className = "h-12 w-12" }: { className?: string }) => (
  <div className={cn(
    "relative overflow-hidden bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center rounded-full",
    "shadow-[0_0_12px_rgba(168,85,247,0.9),0_0_24px_rgba(168,85,247,0.7),0_0_40px_rgba(168,85,247,0.5)]",
    "border border-white/20",
    className
  )}>
    <img 
      src="https://pdftourl.net/images/1781555709150-54f47441-c895-44f4-b71c-11b5ae082e44.jpg" 
      alt="ZennSMM Logo" 
      className="h-full w-full object-cover" 
    />
    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
  </div>
);

const Footer = () => {
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentYear = mounted ? new Date().getFullYear() : 2025;

  return (
    <footer className="bg-white border-t border-slate-100 pt-16 pb-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3">
              <BrandLogo />
              <span className="text-2xl font-black tracking-[-0.03em] text-primary font-sans">ZennSMM</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              The easiest way to grow your social media. Buy followers, likes, and views in just a few clicks.
            </p>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold tracking-widest opacity-60">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <span>100% SECURE PAYMENTS</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-6">Quick Links</h3>
            <ul className="space-y-4">
              <li><Link href="/services" className="text-sm text-muted-foreground hover:text-primary transition-colors">Services</Link></li>
              <li><Link href="/order" className="text-sm text-muted-foreground hover:text-primary transition-colors">New Order</Link></li>
              <li><Link href="/api-docs" className="text-sm text-muted-foreground hover:text-primary transition-colors">For Developers</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-6">Support</h3>
            <ul className="space-y-4">
              <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Use</Link></li>
              <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/refund" className="text-sm text-muted-foreground hover:text-primary transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-6">Need Help?</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>support@zennsmm.com</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span>24/7 Live Support</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <p className="text-xs text-muted-foreground opacity-60">
              © {currentYear} ZennSMM. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-6 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
            <div className="text-[10px] font-bold border border-slate-200 px-2 py-1 rounded">RAZORPAY</div>
            <div className="text-[10px] font-bold border border-slate-200 px-2 py-1 rounded">SECURE SSL</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;