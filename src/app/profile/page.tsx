"use client";

import { useEffect, useMemo } from 'react';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, Mail, Calendar, ShieldCheck, ShoppingBag, Wallet, Zap, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
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

  const userDocRef = useMemo(() => (user && db ? doc(db, 'users', user.uid) : null), [user, db]);
  const { data: profile, loading: profileLoading } = useDoc(userDocRef);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-bold text-primary animate-pulse uppercase tracking-widest">Loading Profile...</p>
      </div>
    );
  }

  if (!user) return null; // Handled by useEffect redirect

  const joinDate = user.metadata.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) 
    : 'Recently';

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Avatar & Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden text-center pb-8">
            <div className="h-24 bg-gradient-to-br from-primary to-purple-400 w-full mb-12"></div>
            <div className="relative -mt-20 inline-block">
              <Avatar className="h-24 w-24 border-4 border-white shadow-xl mx-auto">
                <AvatarImage src={user.photoURL || ''} />
                <AvatarFallback className="bg-primary text-white text-2xl font-bold">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                <ShieldCheck className="h-3 w-3 text-white" />
              </div>
            </div>
            <div className="mt-4 px-6">
              <h2 className="text-xl font-extrabold truncate">{profile?.displayName || user.displayName || 'User'}</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Verified Member</p>
            </div>
            <div className="mt-8 px-6 space-y-4">
              <Link href="/settings" className="block">
                <Button variant="outline" className="w-full rounded-xl font-bold border-slate-200">Edit Profile</Button>
              </Link>
            </div>
          </Card>

          <Card className="rounded-3xl border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3 text-slate-600">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-[13px] font-medium truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-[13px] font-medium">Joined {joinDate}</span>
            </div>
          </Card>
        </div>

        {/* Right Column: Detailed Stats & Actions */}
        <div className="lg:col-span-3 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: 'Available Balance', value: `$${(profile?.balance || 0).toFixed(2)}`, icon: Wallet, color: 'text-purple-600' },
              { label: 'Growth Orders', value: profile?.totalOrders || 0, icon: ShoppingBag, color: 'text-blue-600' },
              { label: 'Growth Level', value: (profile?.totalSpent || 0) > 100 ? 'Premium' : 'Standard', icon: Zap, color: 'text-orange-500' },
            ].map((stat, i) => (
              <Card key={i} className="rounded-3xl border-slate-100 shadow-sm p-6">
                <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-4 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                <p className="text-xl font-extrabold">{stat.value}</p>
              </Card>
            ))}
          </div>

          <Card className="rounded-[2rem] border-slate-100 shadow-sm">
            <CardHeader className="p-8 border-b border-slate-50">
              <CardTitle className="text-lg font-bold">Account Verification</CardTitle>
              <CardDescription>Your security status on the ZennSMM platform.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="bg-green-50 border border-green-100 rounded-2xl p-6 flex items-start gap-4">
                <div className="bg-green-500 p-2 rounded-lg shrink-0">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-green-800">Email Verified</h4>
                  <p className="text-xs text-green-700/70 leading-relaxed">
                    Your account is fully verified. You have complete access to all SMM services and instant fulfillment tools.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
