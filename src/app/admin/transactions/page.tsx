"use client";

import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, increment, serverTimestamp, addDoc, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CreditCard, Search, Loader2, User, Clock, CheckCircle2, XCircle, Download, DollarSign, Wallet, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { exportToCSV, cn } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import { logActivity } from '@/lib/activity-logger';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminTransactionsPage() {
  const db = useFirestore();
  const { user: admin } = useUser();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const transactionsQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'transactions'), orderBy('createdAt', 'desc')) : null,
  [db]);

  const { data: transactions = [], loading } = useCollection(transactionsQuery);

  const stats = useMemo(() => {
    const completed = transactions.filter(t => t.status === 'success' || t.status === 'completed');
    const totalRev = completed.reduce((acc, t) => acc + (t.amount || 0), 0);
    const pending = transactions.filter(t => t.status === 'pending').reduce((acc, t) => acc + (t.amount || 0), 0);
    return { totalRev, pending };
  }, [transactions]);

  const filteredTx = useMemo(() => {
    let list = transactions;
    if (statusFilter !== 'all') list = list.filter(t => t.status === statusFilter);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(t => t.userId?.toLowerCase().includes(s) || t.id.includes(s));
    }
    return list;
  }, [transactions, search, statusFilter]);

  const handleApprove = async (tx: any) => {
    if (!db || !admin) return;
    setLoadingAction(tx.id);
    try {
      await updateDoc(doc(db, 'transactions', tx.id), { status: 'success', updatedAt: serverTimestamp() });
      await updateDoc(doc(db, 'users', tx.userId), { balance: increment(tx.amount) });
      await logActivity(db, `Approved Payment: $${tx.amount} for ${tx.userId.slice(0,8)}`, admin.uid);
      toast({ title: "Payment Validated", description: "Funds credited to user wallet." });
      setSelectedTx(null);
    } catch (err) {
      toast({ title: "Approval Failed", variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async (tx: any) => {
    if (!db || !admin) return;
    setLoadingAction(tx.id);
    try {
      await updateDoc(doc(db, 'transactions', tx.id), { status: 'rejected', updatedAt: serverTimestamp() });
      await logActivity(db, `Rejected Payment: $${tx.amount} for ${tx.userId.slice(0,8)}`, admin.uid);
      toast({ title: "Payment Rejected" });
      setSelectedTx(null);
    } catch (err) {
      toast({ title: "Action Failed", variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black mb-1">Financial <span className="text-primary">Ledger</span></h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Revenue & Wallet Stream</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => exportToCSV(filteredTx, 'transactions_log.csv')}
          className="rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest border-slate-200"
        >
          <Download className="h-4 w-4 mr-2" /> Export Ledger
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-100 shadow-sm rounded-[2rem] bg-slate-900 text-white p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary/20 rounded-2xl"><TrendingUp className="h-6 w-6 text-primary" /></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Gross Volume</span>
          </div>
          <p className="text-3xl font-black">{formatPrice(stats.totalRev, 'USD')}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">Lifetime Validated Revenue</p>
        </Card>
        <Card className="border-slate-100 shadow-sm rounded-[2rem] bg-white p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 rounded-2xl"><Clock className="h-6 w-6 text-orange-500" /></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Queue Status</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{formatPrice(stats.pending, 'USD')}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Payments Awaiting Verification</p>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <Input 
            placeholder="Search User UID or Transaction ID..." 
            className="pl-11 h-12 bg-white border-slate-100 rounded-2xl shadow-sm text-sm font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="h-12 px-6 rounded-2xl bg-white border border-slate-100 font-bold text-sm focus:ring-2 focus:ring-primary/20 shadow-sm min-w-[200px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending Only</option>
          <option value="success">Successful</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <Card className="border-slate-100 shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/30">
                  <th className="px-8 py-4">Source / User</th>
                  <th className="px-8 py-4">Amount</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Processed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [1,2,3].map(i => <tr key={i}><td colSpan={4} className="p-8"><Skeleton className="h-12 w-full rounded-xl" /></td></tr>)
                ) : filteredTx.map((tx) => (
                  <tr key={tx.id} onClick={() => setSelectedTx(tx)} className="hover:bg-slate-50/50 transition-colors h-24 cursor-pointer group">
                    <td className="px-8 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                          <CreditCard className="h-3.5 w-3.5 text-slate-400" /> {tx.paymentMethod || 'Wallet'}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-slate-300 mt-1 uppercase">UID: {tx.userId?.slice(0, 15)}...</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className={cn(
                        "text-sm font-black",
                        tx.amount > 0 ? "text-green-600" : "text-red-600"
                      )}>{tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-8 py-4">
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-black uppercase h-5 px-2 border-0",
                        tx.status === 'success' || tx.status === 'completed' ? "bg-green-50 text-green-600" : (tx.status === 'pending' ? "bg-yellow-50 text-yellow-600" : "bg-red-50 text-red-600")
                      )}>{tx.status || 'success'}</Badge>
                    </td>
                    <td className="px-8 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
        <SheetContent className="sm:max-w-md rounded-l-[3rem] p-0 flex flex-col">
          <SheetHeader className="p-10 bg-slate-50 border-b">
            <SheetTitle className="text-2xl font-black uppercase tracking-tight">Transaction Detail</SheetTitle>
            <SheetDescription className="text-[10px] font-black uppercase tracking-widest text-primary">System Financial Record</SheetDescription>
          </SheetHeader>
          <div className="flex-1 p-10 space-y-10">
             <div className="p-8 bg-slate-50 rounded-3xl space-y-6">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Transaction UUID</p>
                  <p className="text-[11px] font-mono font-bold text-slate-900">{selectedTx?.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target User Identity</p>
                  <p className="text-[11px] font-mono font-bold text-primary">{selectedTx?.userId}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</p>
                    <p className="text-xl font-black text-slate-900">${Math.abs(selectedTx?.amount || 0).toFixed(2)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                    <Badge variant="outline" className="text-[9px] font-black uppercase border-0 bg-white shadow-sm h-5">{selectedTx?.status}</Badge>
                  </div>
                </div>
             </div>

             {selectedTx?.status === 'pending' && (
               <div className="space-y-4">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Protocol Action Required</p>
                 <div className="grid grid-cols-1 gap-3">
                   <Button onClick={() => handleApprove(selectedTx)} disabled={!!loadingAction} className="h-14 rounded-2xl bg-green-600 hover:bg-green-700 font-black uppercase tracking-widest text-xs gap-3">
                     <CheckCircle2 className="h-5 w-5" /> Approve & Credit Wallet
                   </Button>
                   <Button onClick={() => handleReject(selectedTx)} variant="outline" disabled={!!loadingAction} className="h-14 rounded-2xl font-black uppercase tracking-widest text-xs text-red-500 border-red-100 hover:bg-red-50">
                     <XCircle className="h-5 w-5 mr-3" /> Decline Transaction
                   </Button>
                 </div>
               </div>
             )}

             <Button variant="ghost" onClick={() => setSelectedTx(null)} className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 hover:text-slate-500 transition-colors">Close Record</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
