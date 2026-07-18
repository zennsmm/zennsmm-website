
"use client";

import { useUser, useDoc, useFirestore, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ShieldAlert,
  Users,
  ShoppingBag,
  Settings,
  Loader2,
  ArrowRight,
  Layers,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';

const ADMIN_UID = 'V7eWB7Evyuetam8yOJfG2aaDvtO2';

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);
  const [ready, setReady] = useState(false);

  console.log("[AdminDashboard] Auth state:", authLoading ? "Loading" : user?.uid || "Unauthenticated");

  const userDocRef = useMemo(
    () => (user && db ? doc(db, 'users', user.uid) : null),
    [user, db]
  );
  const { data: profile, loading: profileLoading, error: profileError } = useDoc(userDocRef);

  const usersQuery = useMemo(() => (db ? collection(db, 'users') : null), [db]);
  const ordersQuery = useMemo(() => (db ? collection(db, 'orders') : null), [db]);

  const { data: allUsers, error: usersError } = useCollection(usersQuery);
  const { data: allOrders, error: ordersError } = useCollection(ordersQuery);

  // Log permissions errors for debugging
  useEffect(() => {
    if (profileError) console.error("[AdminDashboard] Profile Fetch Error:", profileError.message);
    if (usersError) console.error("[AdminDashboard] Users Query Error:", usersError.message);
    if (ordersError) console.error("[AdminDashboard] Orders Query Error:", ordersError.message);
  }, [profileError, usersError, ordersError]);

  // Timeout so the page never stays blank forever
  useEffect(() => {
    const timer = setTimeout(() => {
      console.warn("[AdminDashboard] Readiness watchdog triggered");
      setTimedOut(true);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  // Auth guard
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      console.log("[AdminDashboard] No active session, routing to admin login");
      router.push('/admin/login');
      return;
    }

    const isAdmin = user.uid === ADMIN_UID || profile?.role === 'admin';
    console.log("[AdminDashboard] Admin verification check:", isAdmin ? "AUTHORIZED" : "UNAUTHORIZED");

    if (!profileLoading || timedOut) {
      if (!isAdmin && !timedOut) {
        console.warn("[AdminDashboard] Access denied for user:", user.uid);
        router.push('/dashboard');
      } else {
        setReady(true);
      }
    }
  }, [user, profile, authLoading, profileLoading, timedOut, router]);

  if (!ready && !timedOut) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    { label: 'Platform Users', value: allUsers?.length ?? 0, icon: Users, color: 'text-primary' },
    { label: 'Total Orders', value: allOrders?.length ?? 0, icon: ShoppingBag, color: 'text-accent' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-accent/10 rounded-2xl">
            <ShieldAlert className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-0.5">Admin <span className="text-accent">Panel</span></h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">System Management</p>
          </div>
        </div>
      </div>

      {(usersError || ordersError) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <p className="text-xs text-red-700 font-bold uppercase">Permissions restricted. Some data may be hidden.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {stats.map((stat, i) => (
          <Card key={i} className="bg-white border-slate-100 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3.5 rounded-2xl bg-slate-50 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50 mb-0.5">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card className="bg-white border-slate-100 rounded-[2rem] shadow-sm">
          <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Infrastructure</CardTitle>
              <h3 className="text-lg font-bold">System Management</h3>
            </div>
            <Settings className="h-5 w-5 text-slate-300" />
          </CardHeader>
          <CardContent className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/admin/services" className="p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-primary/20 transition-all group">
              <Layers className="h-6 w-6 text-primary mb-4" />
              <h4 className="text-sm font-bold mb-1.5">Manage Services</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">Add or update SMM service packages.</p>
              <div className="flex items-center gap-1 text-[9px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                OPEN SERVICES <ArrowRight className="h-3 w-3" />
              </div>
            </Link>

            <Link href="/admin/users" className="p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-primary/20 transition-all group">
              <Users className="h-6 w-6 text-primary mb-4" />
              <h4 className="text-sm font-bold mb-1.5">User Base</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">View registrations and manage balances.</p>
              <div className="flex items-center gap-1 text-[9px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                OPEN USERS <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
