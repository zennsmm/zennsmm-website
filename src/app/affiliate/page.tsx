"use client";

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Share2, TrendingUp, DollarSign, Wallet, Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function AffiliatePage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex flex-col items-center text-center mb-12">
        <div className="bg-primary/10 p-4 rounded-3xl mb-6">
          <Gift className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">Affiliate <span className="text-primary">Program</span></h1>
        <p className="text-muted-foreground max-w-xl text-lg font-medium">
          Earn up to 10% commission on every payment made by your referrals for lifetime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { label: 'Referral Rate', value: '10%', icon: TrendingUp },
          { label: 'Min. Payout', value: '$25.00', icon: Wallet },
          { label: 'Total Earnings', value: '$0.00', icon: DollarSign },
        ].map((stat, i) => (
          <Card key={i} className="rounded-3xl border-slate-100 shadow-sm text-center p-6">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
              <stat.icon className="h-6 w-6 text-primary" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-extrabold text-[#111827]">{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card className="rounded-[2rem] border-slate-100 shadow-xl overflow-hidden bg-white">
        <CardHeader className="p-8 md:p-12 text-center bg-slate-50/50">
          <CardTitle className="text-2xl font-bold mb-2">Ready to start earning?</CardTitle>
          <CardDescription className="text-base">Share your unique link and watch your balance grow.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 md:p-12 space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Your Referral Link</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 h-14 bg-slate-50 rounded-2xl border-2 border-slate-100 flex items-center px-6 font-mono text-sm text-primary font-bold overflow-hidden">
                https://zennsmm.com/ref/{user?.uid || 'user_id'}
              </div>
              <Button size="lg" className="h-14 px-10 rounded-2xl font-bold shadow-lg shadow-primary/20">
                <Share2 className="mr-2 h-5 w-5" /> Copy Link
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
            <div className="space-y-2">
              <h4 className="font-bold text-[#111827]">How it works?</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                When someone clicks your link and registers, they become your referral. You receive a commission every time they add funds.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-[#111827]">Fast Payouts</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                Once you reach the minimum payout, you can request a withdrawal to your wallet balance or bank account.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
