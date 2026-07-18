"use client";

import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, doc, updateDoc, increment, serverTimestamp, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, CheckCircle2, XCircle, Wallet, User, Clock, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/currency';
import { logActivity } from '@/lib/activity-logger';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminPaymentsPage() {
  const db = useFirestore();
  const { user: admin } = useUser();
  const { toast } = useToast();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Removed orderBy to prevent index error
  const pendingTxQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'transactions'), where('status', '==', 'pending')) : null,
  [db]);

  const { data: rawPending = [], loading: pendingLoading } = useCollection(pendingTxQuery);

  // Manual sort in JS
  const pending = useMemo(() => {
    return [...rawPending].sort((a: any, b: any) => {
      const tA = a.createdAt?.toMillis?.() || 0;
      const tB = b.createdAt?.toMillis?.() || 0;
      return tB - tA;
    });
  }, [rawPending]);

  const handleApprove = async (tx: any) => {
    if (!db || !admin) return;
    setLoadingAction(tx.id);
    try {
      await updateDoc(doc(db, 'transactions', tx.id), { status: 'success', updatedAt: serverTimestamp() });
      await updateDoc(doc(db, 'users', tx.userId), { balance: increment(tx.amount) });
      await logActivity(db, `Approved Payment: $${tx.amount} for ${tx.userId.slice(0,8)}`, admin.uid);
      toast({ title: "Payment Validated" });
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
    } catch (err) {
      toast({ title: "Action Failed", variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black mb-1">Payment <span className="text-primary">Gateways</span></h1>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Financial Reconciliation & Verification</p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-slate-100/50 p-1.5 h-14 rounded-2xl mb-8">
          <TabsTrigger value="pending" className="h-11 rounded-xl px-12 font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Pending Approvals {pending.length > 0 && <span className="bg-primary text-white px-2 py-0.5 rounded-full text-[9px] ml-1">{pending.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="history" className="h-11 rounded-xl px-12 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Verification History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card className="border-slate-100 shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/30">
                      <th className="px-8 py-4">Transaction / User</th>
                      <th className="px-8 py-4">Amount</th>
                      <th className="px-8 py-4">Time Elapsed</th>
                      <th className="px-8 py-4 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {pendingLoading ? (
                      [1,2].map(i => <tr key={i}><td colSpan={4} className="p-8"><Skeleton className="h-12 w-full rounded-xl" /></td></tr>)
                    ) : pending.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors h-24">
                        <td className="px-8 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-900 flex items-center gap-2"><CreditCard className="h-3.5 w-3.5 text-slate-400" /> {tx.paymentMethod}</span>
                            <span className="text-[9px] font-mono font-bold text-slate-300 uppercase mt-1">UID: {tx.userId?.slice(0, 15)}...</span>
                          </div>
                        </td>
                        <td className="px-8 py-4"><span className="text-sm font-black text-primary">${(tx.amount || 0).toFixed(2)}</span></td>
                        <td className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleTimeString() : 'Recently'}
                        </td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex justify-end gap-2">
                             <Button onClick={() => handleApprove(tx)} disabled={!!loadingAction} className="h-10 rounded-xl bg-green-500 hover:bg-green-600 font-black uppercase text-[9px] px-5">Approve</Button>
                             <Button onClick={() => handleReject(tx)} variant="outline" disabled={!!loadingAction} className="h-10 rounded-xl font-black uppercase text-[9px] px-5 border-red-100 text-red-500">Decline</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pending.length === 0 && !pendingLoading && (
                      <tr><td colSpan={4} className="p-24 text-center text-xs font-black text-slate-200 uppercase tracking-[0.2em]">Queue Synchronized • No Pending Approvals</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <div className="text-center py-24 text-slate-200 font-black uppercase text-[10px] tracking-widest bg-white border border-slate-100 rounded-[2.5rem]">Full ledger history accessible via primary transactions module.</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}