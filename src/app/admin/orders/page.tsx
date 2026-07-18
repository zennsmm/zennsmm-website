"use client";

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, increment, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Loader2, 
  User, 
  Package, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  ClipboardList,
  Clock,
  XCircle,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { exportToCSV, cn } from '@/lib/utils';
import { logActivity } from '@/lib/activity-logger';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 25;

  const ordersQuery = useMemoFirebase(() => 
    (db && user && !authLoading) ? query(collection(db, 'orders'), orderBy('createdAt', 'desc')) : null,
  [db, user, authLoading]);

  const { data: orders = [], loading: dataLoading } = useCollection(ordersQuery);

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (statusFilter !== 'all') list = list.filter(o => o.status === statusFilter);
    if (userFilter) list = list.filter(o => o.userId?.toLowerCase().includes(userFilter.toLowerCase()));
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(o => o.serviceName.toLowerCase().includes(s) || o.id.toLowerCase().includes(s) || o.link?.toLowerCase().includes(s));
    }
    return list;
  }, [orders, search, statusFilter, userFilter]);

  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice((page - 1) * perPage, page * perPage);
  }, [filteredOrders, page]);

  const handleUpdateStatus = async (orderId: string, newStatus: string, currentOrder?: any) => {
    if (!db || !user) return;
    setLoadingAction(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus, updatedAt: serverTimestamp() });
      await logActivity(db, `Manual Status: Order #${orderId.slice(-6)} to ${newStatus}`, user.uid);
      
      if (newStatus === 'cancelled' && currentOrder && currentOrder.status !== 'cancelled') {
        await updateDoc(doc(db, 'users', currentOrder.userId), { balance: increment(currentOrder.charge) });
        await addDoc(collection(db, 'transactions'), {
          userId: currentOrder.userId,
          amount: currentOrder.charge,
          paymentMethod: 'Refund',
          status: 'success',
          type: 'refund',
          createdAt: serverTimestamp()
        });
        toast({ title: "Order Cancelled", description: "Funds refunded to user balance." });
      } else {
        toast({ title: "Status Synchronized" });
      }
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleBulkAction = async (action: 'cancelled' | 'completed' | 'delete') => {
    if (!db || !user || !selectedIds.length) return;
    if (action === 'delete' && !confirm("Delete records forever?")) return;
    
    setLoadingAction('bulk');
    const batch = writeBatch(db);
    try {
      for (const id of selectedIds) {
        if (action === 'delete') batch.delete(doc(db, 'orders', id));
        else batch.update(doc(db, 'orders', id), { status: action, updatedAt: serverTimestamp() });
      }
      await batch.commit();
      await logActivity(db, `Bulk Action: ${action} on ${selectedIds.length} orders`, user.uid);
      toast({ title: "Bulk Action Applied" });
      setSelectedIds([]);
    } catch (err: any) {
      toast({ title: "Action Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const loading = authLoading || dataLoading;

  const getStatusStyle = (s: string) => {
    switch (s) {
      case 'completed': return 'bg-green-50 text-green-600 border-green-100';
      case 'processing': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'pending': return 'bg-yellow-50 text-yellow-600 border-yellow-100';
      case 'partial': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-slate-400';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black mb-1">Global <span className="text-primary">Orders</span></h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Real-time Fulfillment Control</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => exportToCSV(filteredOrders, 'orders_export.csv')}
            className="rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest border-slate-200"
            disabled={loading || filteredOrders.length === 0}
          >
            <Download className="h-4 w-4 mr-2" /> Export Orders
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <Input 
            placeholder="Search ID, Service, Link..." 
            className="pl-11 h-12 bg-white border-slate-100 rounded-2xl shadow-sm text-sm font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <Input 
            placeholder="Filter by User UID..." 
            className="pl-11 h-12 bg-white border-slate-100 rounded-2xl shadow-sm text-sm font-bold"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
          <TabsList className="bg-slate-100/50 p-1 rounded-2xl h-12 w-full grid grid-cols-3">
            <TabsTrigger value="all" className="rounded-xl font-black text-[9px] uppercase">All</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-xl font-black text-[9px] uppercase">Pending</TabsTrigger>
            <TabsTrigger value="processing" className="rounded-xl font-black text-[9px] uppercase">Active</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="border-slate-100 shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-primary" /> Fulfillment Registry
          </CardTitle>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => handleBulkAction('completed')} className="h-10 rounded-xl bg-green-500 hover:bg-green-600 font-black uppercase text-[9px]">Bulk Complete</Button>
              <Button size="sm" onClick={() => handleBulkAction('cancelled')} className="h-10 rounded-xl bg-red-500 hover:bg-red-600 font-black uppercase text-[9px]">Bulk Cancel</Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/30">
                  <th className="px-8 py-4 w-10">
                    <Checkbox checked={selectedIds.length === paginatedOrders.length && paginatedOrders.length > 0} onCheckedChange={() => setSelectedIds(selectedIds.length === paginatedOrders.length ? [] : paginatedOrders.map(o => o.id))} />
                  </th>
                  <th className="px-8 py-4">ID / Service</th>
                  <th className="px-8 py-4">Quantity / Target</th>
                  <th className="px-8 py-4">Price</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Fulfillment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [1,2,3].map(i => <tr key={i}><td colSpan={6} className="p-8"><Skeleton className="h-14 w-full rounded-2xl" /></td></tr>)
                ) : paginatedOrders.map((o) => (
                  <tr key={o.id} onClick={() => setSelectedOrder(o)} className="hover:bg-slate-50/50 transition-colors h-24 cursor-pointer group">
                    <td className="px-8 py-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selectedIds.includes(o.id)} onCheckedChange={() => setSelectedIds(prev => prev.includes(o.id) ? prev.filter(x => x !== o.id) : [...prev, o.id])} />
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono font-bold text-slate-300 uppercase">#{o.id.slice(-6)}</span>
                        <span className="text-xs font-black line-clamp-1 max-w-[200px]">{o.serviceName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 flex items-center gap-1.5 uppercase"><Package className="h-3 w-3" /> QTY: {o.quantity.toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-primary truncate max-w-[150px]">{o.link}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4"><span className="text-sm font-black text-slate-900">${(o.charge || 0).toFixed(2)}</span></td>
                    <td className="px-8 py-4">
                      <Badge variant="outline" className={cn("text-[9px] font-black uppercase h-5 px-2 border-0", getStatusStyle(o.status))}>{o.status}</Badge>
                      {o.status === 'partial' && <p className="text-[9px] font-bold text-orange-500 mt-1 uppercase tracking-widest">Remains: {o.remains}</p>}
                    </td>
                    <td className="px-8 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                       <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleUpdateStatus(o.id, 'completed')} className="rounded-xl h-9 w-9 text-slate-300 hover:text-green-500 hover:bg-green-50" disabled={!!loadingAction}><CheckCircle2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleUpdateStatus(o.id, 'cancelled', o)} className="rounded-xl h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50" disabled={!!loadingAction}><XCircle className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-8 border-t border-slate-50 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, filteredOrders.length)} of {filteredOrders.length}</p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-xl h-10 px-4 font-black uppercase text-[10px] tracking-widest"><ChevronLeft className="h-4 w-4 mr-1" /> Previous</Button>
              <Button variant="outline" disabled={page * perPage >= filteredOrders.length} onClick={() => setPage(p => p + 1)} className="rounded-xl h-10 px-4 font-black uppercase text-[10px] tracking-widest">Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <SheetContent className="sm:max-w-xl rounded-l-[3rem] p-0 overflow-hidden flex flex-col">
          <SheetHeader className="p-10 bg-slate-50 border-b">
            <SheetTitle className="text-2xl font-black uppercase tracking-tight">Order Profile</SheetTitle>
            <SheetDescription className="text-[10px] font-black uppercase tracking-widest text-primary">Technical Fulfillment Details</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-10 space-y-10">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Package Name</p>
                <p className="text-sm font-black text-slate-900 leading-tight">{selectedOrder?.serviceName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">User Identity</p>
                <p className="text-xs font-mono font-bold text-primary">{selectedOrder?.userId}</p>
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</span>
                <Badge className={cn("text-[10px] font-black uppercase h-6 px-3 border-0", getStatusStyle(selectedOrder?.status))}>{selectedOrder?.status}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity Ordered</span>
                <span className="text-sm font-black">{selectedOrder?.quantity?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Charge</span>
                <span className="text-sm font-black text-primary">${(selectedOrder?.charge || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Terminal Actions</p>
              <div className="grid grid-cols-1 gap-3">
                <select 
                  className="h-12 w-full rounded-2xl bg-slate-50 border-transparent px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                  value={selectedOrder?.status}
                  onChange={(e) => handleUpdateStatus(selectedOrder?.id, e.target.value, selectedOrder)}
                >
                  <option value="pending">Set Pending</option>
                  <option value="processing">Set Processing</option>
                  <option value="completed">Set Completed</option>
                  <option value="partial">Set Partial</option>
                  <option value="cancelled">Set Cancelled (Refund)</option>
                </select>
                <Button className="h-14 rounded-2xl font-black uppercase tracking-widest text-xs gap-2" disabled={!!loadingAction}>
                  <RefreshCw className="h-4 w-4" /> Trigger Provider Refill
                </Button>
                <Button variant="outline" onClick={() => setSelectedOrder(null)} className="h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] border-slate-200">Close Profile</Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}