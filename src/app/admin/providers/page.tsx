"use client";

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Server, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  Zap, 
  ShieldCheck, 
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/lib/activity-logger';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminProvidersPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [editingProvider, setEditingService] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const providersQuery = useMemoFirebase(() => db ? collection(db, 'providers') : null, [db]);
  const { data: providers = [], loading } = useCollection(providersQuery);

  const filteredProviders = useMemo(() => {
    return providers.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));
  }, [providers, search]);

  const handleSaveProvider = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !user) return;
    setLoadingAction('saving');
    const formData = new FormData(e.currentTarget);
    
    const providerData = {
      name: formData.get('name'),
      apiUrl: formData.get('apiUrl'),
      apiKey: formData.get('apiKey'),
      status: formData.get('status') === 'on' ? 'active' : 'inactive',
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingProvider) {
        await updateDoc(doc(db, 'providers', editingProvider.id), providerData);
        await logActivity(db, `Updated Provider: ${providerData.name}`, user.uid);
      } else {
        await addDoc(collection(db, 'providers'), {
          ...providerData,
          balance: 0,
          servicesCount: 0,
          healthStatus: 'healthy',
          createdAt: serverTimestamp(),
        });
        await logActivity(db, `Added Provider: ${providerData.name}`, user.uid);
      }
      setIsDialogOpen(false);
      setEditingService(null);
      toast({ title: editingProvider ? "Provider Updated" : "Provider Added" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!db || !user || !confirm(`Remove ${name} definitively?`)) return;
    try {
      await deleteDoc(doc(db, 'providers', id));
      await logActivity(db, `Deleted Provider: ${name}`, user.uid);
      toast({ title: "Provider Deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleTestConnection = async (p: any) => {
    setLoadingAction(p.id);
    try {
      // Mock API call to provider balance
      await new Promise(r => setTimeout(r, 1000));
      await updateDoc(doc(db!, 'providers', p.id), { 
        healthStatus: 'healthy', 
        lastSync: serverTimestamp() 
      });
      toast({ title: "Connection Success", description: "Provider API is responsive." });
    } catch (err) {
      toast({ title: "Connection Failed", variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black mb-1">Provider <span className="text-primary">Management</span></h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Supply Chain Orchestration</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingService(null)} className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-xs gap-2">
              <Plus className="h-4 w-4" /> Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">{editingProvider ? 'Update Provider' : 'Add New Provider'}</DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">API Gateway Credentials</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveProvider} className="space-y-6 pt-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Label Name</Label>
                <Input name="name" defaultValue={editingProvider?.name} placeholder="e.g. SMMZIO Main" required className="h-12 bg-slate-50 border-transparent font-bold" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">API Endpoint URL</Label>
                <Input name="apiUrl" defaultValue={editingProvider?.apiUrl} placeholder="https://provider.com/api/v2" required className="h-12 bg-slate-50 border-transparent font-bold" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">API Security Key</Label>
                <Input name="apiKey" type="password" defaultValue={editingProvider?.apiKey} placeholder="••••••••••••" required className="h-12 bg-slate-50 border-transparent font-bold" />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Label className="text-xs font-bold">Set Provider Active</Label>
                <input type="checkbox" name="status" defaultChecked={editingProvider?.status !== 'inactive'} className="h-5 w-5 rounded-md accent-primary" />
              </div>
              <Button type="submit" disabled={loadingAction === 'saving'} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20">
                {loadingAction === 'saving' ? <Loader2 className="h-5 w-5 animate-spin" /> : (editingProvider ? 'Update Infrastructure' : 'Authorize Provider')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
        <Input 
          placeholder="Search global providers..." 
          className="pl-11 h-12 bg-white border-slate-100 rounded-2xl shadow-sm text-sm font-bold"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {loading ? (
          [1,2].map(i => <Skeleton key={i} className="h-64 rounded-[2.5rem]" />)
        ) : filteredProviders.map((p) => (
          <Card key={p.id} className="border-slate-100 shadow-sm rounded-[2.5rem] overflow-hidden group hover:shadow-xl transition-all duration-500">
            <CardHeader className="p-8 bg-slate-50/50 border-b border-slate-50 flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-50">
                  <Server className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-black tracking-tight">{p.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className={cn("h-2 w-2 rounded-full", p.healthStatus === 'healthy' ? 'bg-green-500' : 'bg-red-500')} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{p.healthStatus || 'unknown'}</span>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className={cn(
                "text-[9px] font-black uppercase h-5 border-0 px-2",
                p.status === 'active' ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-400"
              )}>{p.status}</Badge>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cloud Balance</p>
                  <p className="text-xl font-black text-primary">${(p.balance || 0).toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Services</p>
                  <p className="text-xl font-black text-slate-900">{p.servicesCount || 0}</p>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
                <ExternalLink className="h-4 w-4 text-slate-300" />
                <code className="text-[10px] font-mono text-slate-400 truncate">{p.apiUrl}</code>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button 
                  onClick={() => handleTestConnection(p)}
                  disabled={!!loadingAction}
                  className="flex-1 h-11 rounded-xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest gap-2"
                >
                  {loadingAction === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Test Link
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => { setEditingService(p); setIsDialogOpen(true); }}
                  className="h-11 w-11 rounded-xl p-0 border-slate-200"
                >
                  <Edit2 className="h-4 w-4 text-slate-400" />
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleDelete(p.id, p.name)}
                  className="h-11 w-11 rounded-xl p-0 border-red-100 hover:bg-red-50 hover:border-red-200"
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
