"use client";

import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, query, orderBy, deleteDoc, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Globe, 
  ShieldCheck, 
  Loader2, 
  DollarSign, 
  Mail, 
  Lock, 
  Calculator,
  ArrowRight,
  AlertCircle,
  Users,
  Zap,
  UserPlus,
  Trash2,
  Search,
  CheckCircle2
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminSettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [markupPreview, setMarkupPreview] = useState(25);
  const [resellerPreview, setResellerPreview] = useState(10);
  const [resellerEmail, setResellerEmail] = useState('');
  const [resellerSearch, setResellerSearch] = useState('');
  const [timedOut, setTimedOut] = useState(false);
  const [emailError, setEmailError] = useState('');
  
  // Configuration Refs
  const siteConfigRef = useMemoFirebase(() => (db ? doc(db, 'system_metadata', 'site_config') : null), [db]);
  const { data: config, loading: configLoading, error: configError } = useDoc(siteConfigRef);

  const pricingConfigRef = useMemoFirebase(() => (db ? doc(db, 'system_metadata', 'pricing_config') : null), [db]);
  const { data: pricingConfig, loading: pricingLoading, error: pricingError } = useDoc(pricingConfigRef);

  const resellerConfigRef = useMemoFirebase(() => (db ? doc(db, 'system_metadata', 'reseller_config') : null), [db]);
  const { data: resellerConfig, loading: resellerLoading, error: resellerError } = useDoc(resellerConfigRef);

  const authorizedResellersQuery = useMemoFirebase(() => (db ? query(collection(db, 'authorized_resellers'), orderBy('createdAt', 'desc')) : null), [db]);
  const { data: authorizedList = [], loading: listLoading } = useCollection(authorizedResellersQuery);

  // Watchdog timer to prevent infinite spinner
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Sync previews with database values
  useEffect(() => {
    if (pricingConfig?.globalMarkup !== undefined) {
      const markup = Number(pricingConfig.globalMarkup);
      setMarkupPreview(markup);
    }
  }, [pricingConfig?.globalMarkup]);

  useEffect(() => {
    if (resellerConfig?.discountPercentage !== undefined) {
      const discount = Number(resellerConfig.discountPercentage);
      setResellerPreview(discount);
    }
  }, [resellerConfig?.discountPercentage]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = async (section: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    
    const formData = new FormData(e.currentTarget);
    const data: any = { updatedAt: serverTimestamp() };
    
    try {
      formData.forEach((val, key) => { 
        if (val === 'on') data[key] = true;
        else if (val === 'off') data[key] = false;
        else if (key === 'globalMarkup') {
          const markup = Number(val);
          if (markup < 1 || markup > 90) throw new Error('Markup must be between 1-90%');
          data[key] = markup;
        }
        else if (key === 'discountPercentage') {
          const discount = Number(val);
          if (discount < 1 || discount > 50) throw new Error('Discount must be between 1-50%');
          data[key] = discount;
        }
        else data[key] = val;
      });

      setLoading(section);
      await setDoc(doc(db, 'system_metadata', section), data, { merge: true });
      toast({ 
        title: "Configuration Updated", 
        description: `Settings for ${section} successfully persisted.` 
      });
    } catch (err: any) {
      toast({ 
        title: "Validation Error", 
        description: err.message || 'Failed to update settings', 
        variant: "destructive" 
      });
    } finally {
      setLoading(null);
    }
  };

  const handleAddReseller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !resellerEmail.trim()) return;
    
    setEmailError('');
    const email = resellerEmail.toLowerCase().trim();
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    if (authorizedList.some(r => r.email?.toLowerCase() === email)) {
      setEmailError('This email is already authorized');
      toast({ 
        title: "Duplicate Entry", 
        description: "This email is already authorized.",
        variant: "destructive" 
      });
      return;
    }

    setLoading('add_reseller');
    try {
      await addDoc(collection(db, 'authorized_resellers'), {
        email,
        createdAt: serverTimestamp(),
      });
      setResellerEmail('');
      setEmailError('');
      toast({ 
        title: "Reseller Authorized", 
        description: `${email} is now pre-approved for reseller pricing.` 
      });
    } catch (err: any) {
      toast({ 
        title: "Failed to Add Reseller", 
        description: err.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(null);
    }
  };

  const handleRemoveReseller = async (id: string, email: string) => {
    if (!db || !confirm(`Remove authorization for ${email}?`)) return;
    setLoading('remove_reseller');
    try {
      await deleteDoc(doc(db, 'authorized_resellers', id));
      toast({ 
        title: "Reseller Removed", 
        description: `${email} is no longer authorized.`
      });
    } catch (err: any) {
      toast({ 
        title: "Error", 
        description: err.message,
        variant: "destructive" 
      });
    } finally {
      setLoading(null);
    }
  };

  const filteredResellers = useMemo(() => {
    return authorizedList.filter(r => r.email?.toLowerCase().includes(resellerSearch.toLowerCase()));
  }, [authorizedList, resellerSearch]);

  const isActuallyLoading = (configLoading || pricingLoading || resellerLoading) && !timedOut;

  if (isActuallyLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading System Config...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black mb-1">Global <span className="text-primary">Orchestration</span></h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Master System Specification Control</p>
        </div>
      </div>

      {(configError || pricingError || resellerError) && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-bold uppercase">
          <AlertCircle className="h-5 w-5 text-red-500" />
          System encountered a partial sync error. Displaying cached state.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* PLATFORM IDENTITY */}
          <Card className="border-slate-100 shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-3">
                <Globe className="h-5 w-5 text-primary" /> Platform Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={(e) => handleSave('site_config', e)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] uppercase font-black text-slate-400 tracking-widest ml-1">Site Title</Label>
                    <Input name="siteName" defaultValue={config?.siteName || "ZennSMM"} className="h-12 rounded-2xl bg-slate-50 border-transparent font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] uppercase font-black text-slate-400 tracking-widest ml-1">Default Currency</Label>
                    <select name="defaultCurrency" defaultValue={config?.defaultCurrency || 'INR'} className="w-full h-12 rounded-2xl bg-slate-50 border-transparent px-4 text-sm font-bold">
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>
                <Button type="submit" disabled={loading === 'site_config'} className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
                  {loading === 'site_config' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Persist Site Identity'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* PRICING MODEL */}
          <Card className="border-slate-100 shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-primary" /> Pricing Model
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase opacity-60">Global markup percentage for all services</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={(e) => handleSave('pricing_config', e)} className="space-y-6">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center mb-1">
                    <Label className="text-[9px] uppercase font-black text-slate-400 tracking-widest ml-1">Markup Percentage (1-90%)</Label>
                    <Badge className="bg-primary/10 text-primary border-0 text-[10px] font-black">{markupPreview}%</Badge>
                  </div>
                  <Input 
                    name="globalMarkup" 
                    type="number" 
                    min="1" 
                    max="90" 
                    value={markupPreview}
                    onChange={(e) => setMarkupPreview(Number(e.target.value))}
                    className="h-12 rounded-2xl bg-slate-50 border-transparent font-bold" 
                    required
                  />
                </div>
                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-3.5 w-3.5 text-slate-400" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Public Margin Preview</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Provider Cost</span>
                        <p className="text-sm font-black text-slate-600">₹100.00</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-300" />
                      <div className="space-y-1 text-right">
                        <span className="text-[8px] font-bold text-primary uppercase">Customer Price</span>
                        <p className="text-sm font-black text-primary">₹{(100 * (1 + markupPreview / 100)).toFixed(2)}</p>
                      </div>
                    </div>
                </div>
                <Button type="submit" disabled={loading === 'pricing_config'} className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px]">
                  {loading === 'pricing_config' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Pricing Model'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* RESELLER DISCOUNT SETTINGS */}
          <Card className="border-slate-100 shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" /> Reseller Discount Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={(e) => handleSave('reseller_config', e)} className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div>
                    <p className="text-sm font-black text-slate-900">Discount Status</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Toggle partner pricing</p>
                  </div>
                  <Switch name="enabled" defaultChecked={resellerConfig?.enabled ?? true} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center mb-1">
                    <Label className="text-[9px] uppercase font-black text-slate-400 tracking-widest ml-1">Discount Amount (1-50%)</Label>
                    <Badge className="bg-primary/10 text-primary border-0 text-[10px] font-black">{resellerPreview}% OFF</Badge>
                  </div>
                  <Input 
                    name="discountPercentage" 
                    type="number" 
                    min="1" 
                    max="50" 
                    value={resellerPreview}
                    onChange={(e) => setResellerPreview(Number(e.target.value))}
                    className="h-12 rounded-2xl bg-slate-50 border-transparent font-bold" 
                    required
                  />
                </div>
                <div className="p-5 bg-slate-900 rounded-3xl space-y-4 text-white">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Live Tier Preview</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-0.5">
                          <span className="text-[8px] font-bold text-slate-500 uppercase">Customer Price</span>
                          <p className="text-xs font-bold text-slate-300">₹{(100 * (1 + markupPreview / 100)).toFixed(2)}</p>
                       </div>
                       <div className="space-y-0.5 text-right">
                          <span className="text-[8px] font-bold text-primary uppercase">Reseller Rate</span>
                          <p className="text-sm font-black text-primary">₹{((100 * (1 + markupPreview / 100)) * (1 - resellerPreview / 100)).toFixed(2)}</p>
                       </div>
                    </div>
                </div>
                <Button type="submit" disabled={loading === 'reseller_config'} className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px]">
                  {loading === 'reseller_config' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Authorize Reseller Protocol'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* AUTHORIZED RESELLERS LIST */}
          <Card className="border-slate-100 shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" /> Authorized Resellers
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase opacity-60">Emails pre-approved for reseller tier access</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <form onSubmit={handleAddReseller} className="flex flex-col gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input 
                    placeholder="partner@example.com" 
                    type="email"
                    value={resellerEmail}
                    onChange={(e) => {
                      setResellerEmail(e.target.value);
                      setEmailError('');
                    }}
                    className="pl-10 h-12 rounded-2xl bg-slate-50 border-transparent font-bold" 
                    required
                  />
                </div>
                {emailError && <p className="text-[10px] font-bold text-red-500 ml-1">{emailError}</p>}
                <Button type="submit" disabled={loading === 'add_reseller'} className="h-12 rounded-2xl px-6 font-black uppercase text-[10px] tracking-widest w-full">
                  {loading === 'add_reseller' ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4 mr-2" /> Authorize Email</>}
                </Button>
              </form>

              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input 
                    placeholder="Search authorized list..." 
                    value={resellerSearch}
                    onChange={(e) => setResellerSearch(e.target.value)}
                    className="pl-10 h-10 rounded-xl bg-slate-50/50 border-transparent text-xs font-bold"
                  />
                </div>

                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 no-scrollbar">
                  {listLoading ? (
                    [1,2].map(i => <Skeleton key={i} className="h-14 rounded-2xl w-full" />)
                  ) : filteredResellers.length > 0 ? filteredResellers.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group transition-all hover:bg-slate-100">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-900 truncate">{r.email}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          Added: {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : 'Now'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-green-50 text-green-600 border-0 text-[8px] font-black uppercase h-5 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Authorized
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveReseller(r.id, r.email)}
                          className="h-8 w-8 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50"
                          disabled={loading === 'remove_reseller'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-10 opacity-30">
                       <Users className="h-10 w-10 mx-auto text-slate-200 mb-2" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registry Empty</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
