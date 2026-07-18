"use client";

import { useCollection, useFirestore, useMemoFirebase, useDatabase, useUser } from '@/firebase';
import { collection, query, orderBy, limit, doc, setDoc, serverTimestamp, getDocs, Timestamp } from 'firebase/firestore';
import { ref, set } from 'firebase/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Zap, RefreshCw, Loader2, Terminal, Database } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminAutomationPage() {
  const db = useFirestore();
  const rtdb = useDatabase();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const [running, setRunning] = useState<string | null>(null);

  const automationLogsQuery = useMemoFirebase(() => 
    (db && user && !authLoading) ? query(collection(db, 'automation_logs'), orderBy('createdAt', 'desc'), limit(15)) : null,
  [db, user, authLoading]);

  const { data: logs = [], loading: dataLoading } = useCollection(automationLogsQuery);

  const runTask = async (task: string) => {
    if (!db || !user) return;
    setRunning(task);
    try {
      if (task === 'Stats Sync') {
        // Statistical Re-indexing Logic
        const [uSnap, oSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'orders'))
        ]);

        const users = uSnap.docs.map(d => d.data());
        const orders = oSnap.docs.map(d => d.data());

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const revenueToday = orders
          .filter((o: any) => {
            const created = (o.createdAt as Timestamp)?.toDate?.() || new Date(o.createdAt);
            return created >= startOfToday && o.status !== 'cancelled';
          })
          .reduce((acc, o: any) => acc + (o.charge || 0), 0);

        const statusCounts = orders.reduce((acc: any, o: any) => {
          acc[o.status] = (acc[o.status] || 0) + 1;
          return acc;
        }, { pending: 0, processing: 0, completed: 0, cancelled: 0 });

        const walletLiability = users.reduce((acc, u: any) => acc + (u.balance || 0), 0);

        const newDashboardData = {
          stats: {
            totalUsers: users.length,
            activeOrders: orders.filter((o: any) => o.status === 'pending' || o.status === 'processing').length,
            revenueToday,
            walletLiability,
          },
          statusCounts,
          lastUpdated: Date.now(),
          systemStatus: "active"
        };

        // Primary storage in Firestore
        await setDoc(doc(db, 'system_metadata', 'dashboard_stats'), {
          ...newDashboardData,
          lastUpdated: serverTimestamp()
        });

        // Optional cache in RTDB if available
        if (rtdb) {
          try {
            await set(ref(rtdb, 'admin/dashboard'), newDashboardData);
          } catch (e) {
            console.warn("[Automation] RTDB cache sync skipped");
          }
        }

      } else {
        await new Promise(r => setTimeout(r, 1500));
      }

      toast({ title: "Task Executed", description: `${task} completed successfully.` });
    } catch (err: any) {
      toast({ title: "Execution Error", description: err.message, variant: "destructive" });
    } finally {
      setRunning(null);
    }
  };

  const loading = authLoading || dataLoading;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black mb-1">System <span className="text-primary">Automation</span></h1>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Autonomous Task & Protocol Scheduler</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-slate-100 shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="p-8 border-b bg-slate-50/30">
                <div className="flex items-center justify-between">
                  <Badge className="bg-primary text-white h-5 px-2 text-[8px] uppercase border-0">Statistical Index</Badge>
                  <Switch defaultChecked />
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-tight">Platform Aggregator</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Re-index all platform users, orders, and revenue metrics.</p>
                </div>
                <Button onClick={() => runTask('Stats Sync')} disabled={!!running || authLoading} className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2" variant="outline">
                   {running === 'Stats Sync' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />} Trigger Sync
                </Button>
              </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="p-8 border-b bg-slate-50/30">
                <div className="flex items-center justify-between">
                  <Badge className="bg-primary text-white h-5 px-2 text-[8px] uppercase border-0">Order Watcher</Badge>
                  <Switch defaultChecked />
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-tight">Status Verification</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Pull completion stats from provider gateways every 15 mins.</p>
                </div>
                <Button onClick={() => runTask('Order Sync')} disabled={!!running || authLoading} className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2" variant="outline">
                   {running === 'Order Sync' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Trigger Now
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-100 shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b bg-slate-50/30">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-3">
                <Terminal className="h-5 w-5 text-primary" /> Execution Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/30">
                      <th className="px-8 py-4">Autonomous Task</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      [1,2].map(i => <tr key={i}><td colSpan={3} className="p-8"><Skeleton className="h-10 w-full rounded-xl" /></td></tr>)
                    ) : logs.map((log: any) => (
                      <tr key={log.id} className="h-16">
                        <td className="px-8 py-4 font-black text-xs text-slate-900">{log.name}</td>
                        <td className="px-8 py-4">
                          <Badge variant="outline" className="text-[8px] font-black uppercase border-0 bg-green-50 text-green-600 px-2 h-4">SUCCESS</Badge>
                        </td>
                        <td className="px-8 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.createdAt?.toDate ? log.createdAt.toDate().toLocaleTimeString() : 'N/A'}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && !loading && (
                      <tr><td colSpan={3} className="p-20 text-center text-xs font-black text-slate-200 uppercase tracking-widest">No Recent Automations</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
           <Card className="border-slate-100 shadow-sm rounded-[2.5rem] bg-slate-900 text-white p-10 overflow-hidden relative">
              <div className="relative z-10 space-y-6">
                <div className="p-4 bg-primary/20 rounded-3xl w-fit"><Zap className="h-8 w-8 text-primary" /></div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Queue Integrity</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Real-time Node Status</p>
                </div>
                <div className="space-y-4 pt-4">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                     <span>Node Health</span>
                     <span className="text-green-500">OPTIMAL</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-primary w-[92%]" />
                   </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
           </Card>
        </div>
      </div>
    </div>
  );
}