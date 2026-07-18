
"use client";

import { useCollection, useFirestore, useUser as useAuthUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, increment, serverTimestamp, addDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Loader2, 
  Wallet, 
  Ban, 
  Download,
  MoreVertical,
  UserCheck,
  ShieldCheck,
  Star
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { exportToCSV, cn } from '@/lib/utils';
import { logActivity } from '@/lib/activity-logger';
import { formatPrice } from '@/lib/currency';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function AdminUsersPage() {
  const db = useFirestore();
  const { user: admin } = useAuthUser();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [userNote, setUserNote] = useState('');

  const usersQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'users'), orderBy('createdAt', 'desc')) : null,
  [db]);

  const { data: users = [], loading } = useCollection(usersQuery);

  const filteredUsers = useMemo(() => {
    let list = users;
    if (roleFilter !== 'all') {
      if (roleFilter === 'banned') list = list.filter(u => u.status === 'banned');
      else list = list.filter(u => u.role === roleFilter);
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(u => u.email?.toLowerCase().includes(s) || u.displayName?.toLowerCase().includes(s) || u.uid.includes(s));
    }
    return list;
  }, [users, search, roleFilter]);

  const handleAdjustBalance = async (uid: string, type: 'add' | 'deduct') => {
    if (!db || !admin || !adjustmentAmount) return;
    const amt = parseFloat(adjustmentAmount);
    if (isNaN(amt) || amt <= 0) return;
    
    setLoadingAction('adjusting');
    const finalAmt = type === 'add' ? amt : -amt;
    
    try {
      await updateDoc(doc(db, 'users', uid), { balance: increment(finalAmt) });
      await addDoc(collection(db, 'transactions'), {
        userId: uid,
        amount: finalAmt,
        paymentMethod: 'Admin Adjustment',
        status: 'success',
        type: 'admin_adjustment',
        createdAt: serverTimestamp()
      });
      await logActivity(db, `${type === 'add' ? 'Added' : 'Deducted'} $${amt} for User ${uid.slice(0,8)}`, admin.uid);
      setAdjustmentAmount('');
      toast({ title: "Balance Synchronized" });
    } catch (err: any) {
      toast({ title: "Adjustment Failed", variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleUpdateRole = async (uid: string, newRole: string) => {
    if (!db || !admin) return;
    setLoadingAction('role');
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole, updatedAt: serverTimestamp() });
      await logActivity(db, `Changed Role to ${newRole.toUpperCase()} for User ${uid.slice(0,8)}`, admin.uid);
      toast({ title: "Role Synchronized", description: `User is now a ${newRole}.` });
    } catch (err) {
      toast({ title: "Failed to update role", variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSaveNotes = async (uid: string) => {
    if (!db || !admin) return;
    setLoadingAction('saving_note');
    try {
      await updateDoc(doc(db, 'users', uid), { notes: userNote, updatedAt: serverTimestamp() });
      toast({ title: "Notes Archived" });
    } catch (err) {
      toast({ title: "Failed to Save", variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleBanUser = async (u: any) => {
    if (!db || !admin || !confirm(`Definitively ban ${u.email}?`)) return;
    try {
      await updateDoc(doc(db, 'users', u.id), { status: 'banned', updatedAt: serverTimestamp() });
      await logActivity(db, `BANNED User: ${u.email}`, admin.uid);
      toast({ title: "Identity Restricted" });
    } catch (err) {
      toast({ title: "Action Failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
           <div>
            <h1 className="text-2xl md:text-3xl font-black mb-1">Account <span className="text-primary">Registry</span></h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Identity & Wallet Infrastructure</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => exportToCSV(filteredUsers, 'user_base.csv')}
          className="rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest border-slate-200"
        >
          <Download className="h-4 w-4 mr-2" /> Export Base
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <Input 
            placeholder="Search email, name or UID..." 
            className="pl-11 h-12 bg-white border-slate-100 rounded-2xl shadow-sm text-sm font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="h-12 px-4 rounded-2xl bg-white border border-slate-100 font-bold text-sm focus:ring-2 focus:ring-primary/20 shadow-sm"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Access Levels</option>
          <option value="user">Retail Customers</option>
          <option value="reseller">Authorized Resellers</option>
          <option value="admin">Administrators</option>
        </select>
      </div>

      <Card className="border-slate-100 shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/30">
                  <th className="px-8 py-4">User Spec</th>
                  <th className="px-8 py-4">Wallet Balance</th>
                  <th className="px-8 py-4">Identity / Role</th>
                  <th className="px-8 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [1,2,3].map(i => <tr key={i}><td colSpan={4} className="p-8"><Skeleton className="h-14 w-full rounded-2xl" /></td></tr>)
                ) : filteredUsers.map((u) => (
                  <tr key={u.id} onClick={() => { setSelectedUser(u); setUserNote(u.notes || ''); }} className="hover:bg-slate-50/50 transition-colors h-24 cursor-pointer group">
                    <td className="px-8 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-900">{u.displayName || 'Anonymous'}</span>
                        <span className="text-[10px] font-bold text-slate-400">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-sm font-black text-primary">{formatPrice(u.balance || 0, 'USD')}</span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex gap-2">
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-black uppercase h-5 px-2 border-0",
                          u.role === 'admin' ? "bg-slate-900 text-white" : (u.role === 'reseller' ? "bg-primary text-white" : "bg-slate-100 text-slate-500")
                        )}>{u.role || 'user'}</Badge>
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-black uppercase h-5 px-2 border-0",
                          u.status === 'active' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                        )}>{u.status || 'active'}</Badge>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-slate-300 group-hover:text-primary"><MoreVertical className="h-5 w-5" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <SheetContent className="sm:max-w-2xl rounded-l-[3rem] p-0 overflow-hidden flex flex-col">
          <SheetHeader className="p-10 bg-slate-50 border-b">
            <SheetTitle className="text-2xl font-black uppercase tracking-tight">Identity Terminal</SheetTitle>
            <SheetDescription className="text-[10px] font-black uppercase tracking-widest text-primary">Cross-Tier Profile Management</SheetDescription>
          </SheetHeader>
          <Tabs defaultValue="profile" className="flex-1 flex flex-col">
            <TabsList className="bg-slate-50/50 p-6 border-b rounded-none h-auto gap-4">
              <TabsTrigger value="profile" className="h-10 rounded-xl px-6 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Account Summary</TabsTrigger>
              <TabsTrigger value="roles" className="h-10 rounded-xl px-6 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Tier Configuration</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-y-auto p-10">
              <TabsContent value="profile" className="space-y-10 m-0">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified Email</p>
                    <p className="text-sm font-black text-primary">{selectedUser?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Membership Tier</p>
                    <Badge className="font-black uppercase text-[10px]">{selectedUser?.role?.toUpperCase() || 'RETAIL'}</Badge>
                  </div>
                </div>

                <div className="p-8 bg-slate-900 rounded-[2rem] text-white space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Wallet className="h-5 w-5 text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Wallet Balance</span>
                    </div>
                    <span className="text-2xl font-black">{formatPrice(selectedUser?.balance || 0, 'USD')}</span>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="0.00" 
                      type="number" 
                      className="bg-white/5 border-white/10 h-12 text-white font-bold"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(e.target.value)}
                    />
                    <Button onClick={() => handleAdjustBalance(selectedUser.id, 'add')} className="h-12 rounded-xl bg-green-600 hover:bg-green-700 font-black px-6 uppercase text-[10px]">Credit</Button>
                    <Button onClick={() => handleAdjustBalance(selectedUser.id, 'deduct')} className="h-12 rounded-xl bg-red-600 hover:bg-red-700 font-black px-6 uppercase text-[10px]">Debit</Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Internal Ledger Notes</Label>
                  <Textarea 
                    className="h-32 bg-slate-50 border-transparent font-bold rounded-2xl"
                    placeholder="Technical observations..."
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                  />
                  <Button onClick={() => handleSaveNotes(selectedUser.id)} className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest" variant="outline">Archive Note</Button>
                </div>

                <Button onClick={() => handleBanUser(selectedUser)} className="w-full h-14 rounded-2xl bg-red-500 hover:bg-red-600 font-black uppercase tracking-widest text-xs gap-3">
                   <Ban className="h-5 w-5" /> Account Suspension (BAN)
                </Button>
              </TabsContent>

              <TabsContent value="roles" className="m-0 space-y-8">
                 <div className="bg-primary/5 border border-primary/10 rounded-3xl p-8 space-y-6">
                    <div className="flex items-center gap-3">
                       <UserCheck className="h-6 w-6 text-primary" />
                       <h3 className="text-lg font-black uppercase tracking-tight">Identity Synchronization</h3>
                    </div>
                    <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-wider">Configure the access tier and pricing model for this identity.</p>
                    
                    <div className="grid grid-cols-1 gap-3">
                       <Button 
                         variant={selectedUser?.role === 'user' ? 'default' : 'outline'} 
                         className="h-14 rounded-2xl justify-start px-6 gap-4"
                         onClick={() => handleUpdateRole(selectedUser.id, 'user')}
                         disabled={loadingAction === 'role'}
                       >
                         <div className="p-2 bg-white/10 rounded-lg"><Users className="h-4 w-4" /></div>
                         <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest">Retail Customer</p>
                            <p className="text-[9px] font-bold opacity-60">Standard Pricing Protocol</p>
                         </div>
                       </Button>
                       
                       <Button 
                         variant={selectedUser?.role === 'reseller' ? 'default' : 'outline'} 
                         className="h-14 rounded-2xl justify-start px-6 gap-4 border-primary/20"
                         onClick={() => handleUpdateRole(selectedUser.id, 'reseller')}
                         disabled={loadingAction === 'role'}
                       >
                         <div className="p-2 bg-primary/20 rounded-lg"><Star className="h-4 w-4 text-primary" /></div>
                         <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Authorized Reseller</p>
                            <p className="text-[9px] font-bold text-primary opacity-60">Identity-Based Discount Enabled</p>
                         </div>
                       </Button>

                       <Button 
                         variant={selectedUser?.role === 'admin' ? 'default' : 'outline'} 
                         className="h-14 rounded-2xl justify-start px-6 gap-4 border-red-200"
                         onClick={() => handleUpdateRole(selectedUser.id, 'admin')}
                         disabled={loadingAction === 'role'}
                       >
                         <div className="p-2 bg-red-100 rounded-lg"><ShieldCheck className="h-4 w-4 text-red-600" /></div>
                         <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Administrator</p>
                            <p className="text-[9px] font-bold text-red-400 opacity-60">Full Control Infrastructure Access</p>
                         </div>
                       </Button>
                    </div>
                 </div>
              </TabsContent>
            </div>
          </Tabs>
        </SheetContent>
      </Sheet>
    </div>
  );
}
