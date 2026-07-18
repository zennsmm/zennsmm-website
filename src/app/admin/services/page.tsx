
"use client";

import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc, setDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Search,
  Trash2,
  Edit2,
  Loader2,
  Download,
  Layers,
  LayoutGrid,
  Zap,
  Star
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { exportToCSV, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminServicesPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const servicesQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'services'), orderBy('category')) : null,
  [db]);

  const categoriesQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'service_categories'), orderBy('name')) : null,
  [db]);

  // FETCH CONFIGS
  const pricingRef = useMemoFirebase(() => db ? doc(db, 'system_metadata', 'pricing_config') : null, [db]);
  const resellerRef = useMemoFirebase(() => db ? doc(db, 'system_metadata', 'reseller_config') : null, [db]);
  
  const { data: pricing } = useDoc(pricingRef);
  const { data: resellerConfig } = useDoc(resellerRef);
  
  const markup = pricing?.globalMarkup ?? 25;
  const resellerDiscount = resellerConfig?.discountPercentage ?? 10;

  const { data: services = [], loading } = useCollection(servicesQuery);
  const { data: categories = [] } = useCollection(categoriesQuery);

  const filteredServices = useMemo(() => {
    let list = services;
    if (categoryFilter !== 'all') list = list.filter(s => s.category === categoryFilter);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(s => s.name?.toLowerCase().includes(s) || s.serviceId?.toString().includes(s));
    }
    return list;
  }, [services, search, categoryFilter]);

  const handleSaveService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    setLoadingAction('saving');
    const formData = new FormData(e.currentTarget);
    const serviceData = {
      serviceId: formData.get('serviceId'),
      name: formData.get('name'),
      category: formData.get('category'),
      rate: formData.get('rate'),
      min: formData.get('min'),
      max: formData.get('max'),
      description: formData.get('description'),
      refill: formData.get('refill') === 'on',
      status: formData.get('status') === 'on' ? 'active' : 'disabled',
      updatedAt: serverTimestamp(),
    };

    try {
      const id = editingService?.id || `svc_${Math.random().toString(36).substring(7)}`;
      await setDoc(doc(db, 'services', id), serviceData, { merge: true });
      toast({ title: editingService ? "Service Updated" : "Service Created" });
      setIsDialogOpen(false);
      setEditingService(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black mb-1">Catalog <span className="text-primary">Registry</span></h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Multi-Tier Pricing Orchestration</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => exportToCSV(filteredServices, 'catalog.csv')} className="rounded-2xl h-12 font-black uppercase text-[10px]">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingService(null)} className="rounded-2xl h-12 font-black uppercase text-xs">
                <Plus className="h-4 w-4 mr-2" /> Add Package
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-[2.5rem]">
              <DialogHeader><DialogTitle>Package Entry</DialogTitle></DialogHeader>
              <form onSubmit={handleSaveService} className="space-y-4 pt-4">
                 <div className="grid grid-cols-2 gap-4">
                  <Input name="serviceId" defaultValue={editingService?.serviceId} placeholder="Provider ID" required className="h-11" />
                  <select name="category" defaultValue={editingService?.category} className="w-full h-11 rounded-xl bg-slate-50 border-transparent px-3 text-sm font-bold">
                    {categories.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <Input name="name" defaultValue={editingService?.name} placeholder="Service Label" required className="h-11" />
                <div className="grid grid-cols-3 gap-4">
                  <Input name="rate" type="number" step="0.0001" defaultValue={editingService?.rate} placeholder="Cost Rate" required className="h-11" />
                  <Input name="min" type="number" defaultValue={editingService?.min} placeholder="Min" required className="h-11" />
                  <Input name="max" type="number" defaultValue={editingService?.max} placeholder="Max" required className="h-11" />
                </div>
                <Textarea name="description" defaultValue={editingService?.description} className="h-32 rounded-2xl" placeholder="Specs..." />
                <Button type="submit" disabled={loadingAction === 'saving'} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs">
                  {loadingAction === 'saving' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Commit Specification'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="bg-slate-100/50 p-1.5 h-14 rounded-2xl mb-8">
          <TabsTrigger value="services" className="h-11 rounded-xl px-12 font-black uppercase text-[10px] gap-2 data-[state=active]:bg-white">
            <LayoutGrid className="h-4 w-4" /> Package Ledger
          </TabsTrigger>
          <TabsTrigger value="categories" className="h-11 rounded-xl px-12 font-black uppercase text-[10px] gap-2 data-[state=active]:bg-white">
            <Layers className="h-4 w-4" /> Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services">
          <Card className="border-slate-100 shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="relative w-72">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input placeholder="Search catalog..." className="pl-11 h-12 rounded-2xl" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/30">
                      <th className="px-8 py-4 w-10"><Checkbox /></th>
                      <th className="px-8 py-4">Package Identity</th>
                      <th className="px-8 py-4">Cost (Provider)</th>
                      <th className="px-8 py-4">Price (Retail)</th>
                      <th className="px-8 py-4">Rate (Reseller)</th>
                      <th className="px-8 py-4 text-right">Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      [1,2].map(i => <tr key={i}><td colSpan={6} className="p-8"><Skeleton className="h-12 w-full rounded-xl" /></td></tr>)
                    ) : filteredServices.map((s) => {
                      const retail = parseFloat(s.rate) * (1 + markup / 100);
                      const reseller = retail * (1 - resellerDiscount / 100);
                      return (
                        <tr key={s.id} className={cn("hover:bg-slate-50/50 transition-colors h-24", s.status === 'disabled' && "opacity-50")}>
                          <td className="px-8 py-4"><Checkbox /></td>
                          <td className="px-8 py-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-black line-clamp-1">{s.name}</span>
                              <Badge variant="outline" className="text-[8px] font-black uppercase w-fit h-4">{s.category}</Badge>
                            </div>
                          </td>
                          <td className="px-8 py-4"><span className="text-[11px] font-bold text-slate-400">${parseFloat(s.rate).toFixed(2)}</span></td>
                          <td className="px-8 py-4"><span className="text-sm font-black text-slate-900">${retail.toFixed(2)}</span></td>
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-1.5">
                               <Star className="h-3 w-3 text-primary" />
                               <span className="text-sm font-black text-primary">${reseller.toFixed(2)}</span>
                            </div>
                          </td>
                          <td className="px-8 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => { setEditingService(s); setIsDialogOpen(true); }} className="rounded-xl h-10 w-10 text-slate-400 hover:text-primary"><Edit2 className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteDoc(doc(db!, 'services', s.id))} className="rounded-xl h-10 w-10 text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="categories">
           <div className="text-center py-20 text-slate-300 font-bold uppercase text-[10px] tracking-widest bg-white border border-slate-100 rounded-[2.5rem]">Taxonomy module loading...</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
