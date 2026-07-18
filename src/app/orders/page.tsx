"use client";

import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Search, ExternalLink, Package, Clock, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useMemo, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/currency';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Removed orderBy to prevent composite index requirement
  const ordersQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );
  }, [db, user]);

  const { data: rawOrders = [], loading: dataLoading } = useCollection(ordersQuery);

  // Manual sort in JS
  const orders = useMemo(() => {
    return [...rawOrders].sort((a: any, b: any) => {
      const tA = a.createdAt?.toMillis?.() || 0;
      const tB = b.createdAt?.toMillis?.() || 0;
      return tB - tA;
    });
  }, [rawOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.serviceName.toLowerCase().includes(search.toLowerCase()) ||
      o.link.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [orders, search]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelled':
      case 'refunded': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Authorizing...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-1">My <span className="text-primary">Orders</span></h1>
          <p className="text-sm text-muted-foreground">Check the status of your social media growth.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
          <Input 
            placeholder="Search my orders..." 
            className="pl-10 h-11 text-sm bg-white border-slate-200 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {dataLoading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 w-full bg-slate-100 rounded-2xl" />)}
        </div>
      ) : filteredOrders.length > 0 ? (
        <Card className="bg-white border-slate-100 overflow-hidden shadow-sm rounded-[2rem]">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-100 h-12">
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest px-8">Order ID</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest px-8">Service Name</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest px-8">Details</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest px-8">Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest px-8 text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className="border-slate-100 h-20 hover:bg-slate-50/50 transition-colors group">
                    <TableCell className="px-8">
                      <span className="text-xs font-mono text-muted-foreground font-bold">#{order.id.slice(-6).toUpperCase()}</span>
                    </TableCell>
                    <TableCell className="px-8">
                      <div className="flex flex-col max-w-[280px]">
                        <span className="text-sm font-bold leading-tight">{order.serviceName}</span>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-full font-bold">
                            <Package className="h-3 w-3" /> Qty: {order.quantity}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-8">
                      <a 
                        href={order.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[11px] text-primary hover:underline flex items-center gap-1.5 font-bold mb-1"
                      >
                        Target Link <ExternalLink className="h-3 w-3" />
                      </a>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Clock className="h-2.5 w-2.5" />
                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Just now'}
                      </div>
                    </TableCell>
                    <TableCell className="px-8">
                      <Badge variant="outline" className={`text-[10px] h-6 px-3 border-transparent uppercase font-bold tracking-widest rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-8 text-right">
                      <span className="text-sm font-bold text-primary">
                        {mounted ? formatPrice(order.charge) : `$${order.charge.toFixed(2)}`}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <div className="text-center py-32 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
          <div className="p-6 bg-slate-50 rounded-full inline-block mb-6">
            <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto" />
          </div>
          <h3 className="text-xl font-bold mb-2">No orders found</h3>
          <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">Start your social media journey by placing your first order today.</p>
          <Link href="/order" className="inline-block mt-8">
            <Button className="rounded-full px-10 h-12 font-bold">Place First Order</Button>
          </Link>
        </div>
      )}
    </div>
  );
}