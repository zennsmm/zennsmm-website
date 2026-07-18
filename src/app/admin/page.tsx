"use client";

import { useFirestore, useCollection, useMemoFirebase, useDatabase, useUser } from '@/firebase';
import { collection, query, orderBy, limit, serverTimestamp, getDocs, Timestamp } from 'firebase/firestore';
import { ref, get, set } from 'firebase/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Clock, 
  Wallet,
  Activity as ActivityIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMemo, useState, useEffect } from 'react';
import { formatPrice } from '@/lib/currency';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AdminOverview() {
  const db = useFirestore();
  const rtdb = useDatabase();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Watchdog timeout to prevent infinite loading states
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // 1. Fetch Dashboard Stats from Realtime Database (Requested Pattern)
  useEffect(() => {
    if (!rtdb) return;

    const fetchDashboard = async () => {
      try {
        const dashboardRef = ref(rtdb, 'admin/dashboard');
        const snapshot = await get(dashboardRef);
        
        if (snapshot.exists()) {
          setDashboardData(snapshot.val());
        } else {
          // Initialize if empty
          const initialData = {
            stats: {
              totalUsers: 0,
              activeOrders: 0,
              revenueToday: 0,
              walletLiability: 0
            },
            statusCounts: {
              pending: 0,
              processing: 0,
              completed: 0,
              cancelled: 0
            },
            systemStatus: "active",
            lastUpdated: Date.now()
          };
          await set(dashboardRef, initialData);
          setDashboardData(initialData);
        }
      } catch (err: any) {
        setError(err.message);
        console.error("[RTDB Error]:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [rtdb]);

  // 2. Real-time Firestore streams for live lists
  const recentOrdersQuery = useMemoFirebase(() => 
    (db && user && !authLoading) ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(10)) : null, 
  [db, user, authLoading]);
  
  const recentLogsQuery = useMemoFirebase(() => 
    (db && user && !authLoading) ? query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(10)) : null, 
  [db, user, authLoading]);

  const { data: recentOrders = [] } = useCollection(recentOrdersQuery);
  const { data: logs = [] } = useCollection(recentLogsQuery);

  const stats = useMemo(() => {
    const s = dashboardData?.stats || {};
    return [
      { label: 'Platform Users', value: s.totalUsers || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Active Orders', value: s.activeOrders || 0, icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50' },
      { label: 'Revenue Today', value: formatPrice(s.revenueToday || 0, 'USD'), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
      { label: 'Wallet Liability', value: formatPrice(s.walletLiability || 0, 'USD'), icon: Wallet, color: 'text-orange-600', bg: 'bg-orange-50' },
    ];
  }, [dashboardData]);

  const orderStatuses = useMemo(() => {
    const s = dashboardData?.statusCounts || {};
    return [
      { label: 'Pending', count: s.pending || 0, color: 'bg-yellow-500', icon: Clock },
      { label: 'Active', count: s.processing || 0, color: 'bg-blue-500', icon: RefreshCw },
      { label: 'Completed', count: s.completed || 0, color: 'bg-green-500', icon: CheckCircle2 },
      { label: 'Cancelled', count: s.cancelled || 0, color: 'bg-red-500', icon: AlertCircle },
    ];
  }, [dashboardData]);

  const handleManualSync = async () => {
    if (!db || !rtdb) return;
    setSyncing(true);
    try {
      // Aggregate statistics from Firestore
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

      // Push to Realtime Database
      await set(ref(rtdb, 'admin/dashboard'), newDashboardData);
      setDashboardData(newDashboardData);

      toast({ title: "Stats Synchronized", description: "Dashboard records updated from source." });
    } catch (err: any) {
      toast({ title: "Sync Failed", description: err.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6 animate-in fade-in duration-700 max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-black mb-0.5 truncate">Terminal <span className="text-primary">Overview</span></h1>
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60 truncate">
            {dashboardData?.lastUpdated ? `Refreshed ${new Date(dashboardData.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'First Sync Required'}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleManualSync} 
          disabled={syncing}
          className="rounded-xl h-10 w-full sm:w-auto px-4 font-black uppercase text-[9px] tracking-[0.1em] gap-2 border-primary/20 hover:bg-primary/5 shrink-0"
        >
          {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Re-Aggregated Stats
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-[10px] font-bold uppercase">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <Card key={i} className="border-slate-100 shadow-sm rounded-[1.25rem] overflow-hidden group relative hover:shadow-md transition-shadow h-[95px] sm:h-[110px]">
            <CardContent className="p-3 flex flex-col justify-between h-full">
              <div className="flex items-start justify-between">
                <div className={cn("p-2 rounded-xl transition-transform group-hover:scale-105 shrink-0", stat.bg)}>
                  <stat.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", stat.color)} />
                </div>
                <Badge className="bg-green-50 text-green-600 text-[8px] uppercase font-black tracking-tighter border-0 h-4 px-1 absolute top-2 right-2">Live</Badge>
              </div>
              <div className="min-w-0">
                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50 mb-0.5 truncate">{stat.label}</p>
                <p className="text-sm sm:text-lg font-black tracking-tight text-[#111827] truncate">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {orderStatuses.map((status, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-primary/20 transition-colors h-[70px] sm:h-[80px]">
            <div className={cn("p-2 rounded-lg shrink-0", status.color.replace('500', '50'))}>
               <status.icon className={cn("h-4 w-4", status.color.replace('bg-', 'text-'))} />
            </div>
            <div className="min-w-0">
              <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{status.label}</p>
              <p className="text-sm sm:text-base font-black text-slate-900 truncate">{status.count}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-slate-100 shadow-sm rounded-2xl overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b p-4 sm:p-5">
            <CardTitle className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Order Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-x-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/30">
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentOrders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors h-12 sm:h-14">
                      <td className="px-4 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[8px] font-mono font-bold text-slate-300 uppercase truncate">#{order.id.slice(-4).toUpperCase()}</span>
                          <span className="text-[10px] sm:text-[11px] font-black line-clamp-1 text-[#111827]">{order.serviceName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="outline" className={cn(
                          "text-[8px] font-black uppercase h-4 px-1.5 border-0 shrink-0",
                          order.status === 'completed' ? "bg-green-50 text-green-600" : 
                          order.status === 'processing' ? "bg-blue-50 text-blue-600" : 
                          order.status === 'pending' ? "bg-yellow-50 text-yellow-600" : "bg-red-50 text-red-600"
                        )}>{order.status}</Badge>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className="text-[11px] sm:text-xs font-black text-primary">${(order.charge || 0).toFixed(2)}</span>
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr><td colSpan={3} className="p-12 text-center text-[9px] font-black text-slate-200 uppercase tracking-widest">No Recent Orders</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b p-4 sm:p-5">
            <CardTitle className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
              <ActivityIcon className="h-4 w-4 text-primary" /> Live Audit
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="space-y-4">
              {logs.length > 0 ? logs.map((log: any) => (
                <div key={log.id} className="flex gap-3 group">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shrink-0 animate-pulse" />
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-black text-slate-900 leading-tight mb-0.5 group-hover:text-primary transition-colors line-clamp-2">{log.action}</p>
                    <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                      <span className="truncate">UID: {log.userId?.slice(0,6)}</span>
                      <span className="opacity-30">•</span>
                      <span>
                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                      </span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 opacity-20">
                   <TrendingUp className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                   <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">No activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}