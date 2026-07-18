"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useUser, useDoc, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, serverTimestamp, addDoc, updateDoc, increment, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Wallet, 
  ShoppingCart, 
  ShieldCheck, 
  Zap,
  Clock,
  Package,
  ExternalLink,
  Loader2,
  CreditCard,
  Star,
  TrendingUp,
  Instagram,
  Facebook,
  Youtube,
  Send,
  Twitter,
  AlertTriangle,
  ChevronDown,
  ClipboardList
} from 'lucide-react';
import Link from 'next/link';
import { formatPrice, CurrencyCode, DEFAULT_CURRENCY, CURRENCIES } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import ForcePasswordChange from "@/components/ForcePasswordChange";

// --- ORDERING ENGINE COMPONENTS ---

interface SMMService {
  id: string;
  serviceId: string;
  name: string;
  category: string;
  rate: string;
  min: string;
  max: string;
  description: string;
  refill: boolean;
}

const PlatformIcon = ({ name, className }: { name: string; className?: string }) => {
  const n = name.toLowerCase();
  if (n.includes('instagram') || n.includes('ig ')) return <Instagram className={cn("text-[#E4405F]", className)} />;
  if (n.includes('facebook') || n.includes('fb ')) return <Facebook className={cn("text-[#1877F2]", className)} />;
  if (n.includes('youtube') || n.includes('yt ')) return <Youtube className={cn("text-[#FF0000]", className)} />;
  if (n.includes('telegram') || n.includes('tg ')) return <Send className={cn("text-[#26A5E4]", className)} />;
  if (n.includes('twitter') || n.includes(' x ') || n.includes(' x') || n.includes('tiktok')) return <Zap className={cn("text-primary", className)} />;
  return <Zap className={cn("text-primary", className)} />;
};

const ServiceDescription = ({ service }: { service: SMMService }) => {
  if (!service) return null;
  const n = service.name.toLowerCase();
  
  const getRefillText = () => {
    if (n.includes('no refill') || n.includes('non refill')) return 'No Refill';
    if (n.includes('lifetime')) return 'Lifetime';
    if (n.includes('365 day')) return '365 Days';
    if (n.includes('30 day')) return '30 Days';
    return service.refill ? '30 Days' : 'No Refill';
  };

  const refillValue = getRefillText();
  const isRefill = !refillValue.includes('No Refill');

  return (
    <div className="bg-white border border-slate-100 rounded-[20px] shadow-sm overflow-hidden mb-4 animate-in fade-in duration-300">
      <div className="bg-primary/5 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-50">
            <ClipboardList className="h-4 w-4 text-primary" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#111827]">Service Specification</span>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="flex items-start gap-2.5">
            <Clock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-slate-500 uppercase leading-none mb-1">Start Time</p>
              <p className="text-[12px] font-black text-[#111827] truncate">
                {n.includes('instant') ? 'Instant' : '0-1 Hours'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <TrendingUp className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-slate-500 uppercase leading-none mb-1">Daily Speed</p>
              <p className="text-[12px] font-black text-[#111827] truncate">
                {n.match(/\d+k/i)?.[0]?.toUpperCase() || '50K'}/Day
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-slate-500 uppercase leading-none mb-1">Quality</p>
              <p className="text-[12px] font-black text-[#111827] truncate">High Quality</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Zap className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-slate-500 uppercase leading-none mb-1">Refill</p>
              <p className={cn("text-[12px] font-black truncate", isRefill ? "text-green-600" : "text-red-500")}>
                {refillValue}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD PAGE ---

export default function UnifiedDashboardPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [forcingChange, setForcingChange] = useState(false);
  
  // Ordering Engine State
  const [services, setServices] = useState<SMMService[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [category, setCategory] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
    const savedCurrency = localStorage.getItem('zennsmm_currency') as CurrencyCode;
    if (savedCurrency && CURRENCIES[savedCurrency]) setCurrency(savedCurrency);

    if (!db) return;
    const preloadServices = async () => {
      try {
        const q = query(collection(db, 'services'));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as SMMService));
        if (list.length > 0) setServices(list);
      } catch (err) {
        console.error("[Dashboard] Services sync failed", err);
      } finally {
        setLoadingServices(false);
      }
    };
    preloadServices();
  }, [db]);

  // Data Fetching
  const userDocRef = useMemo(() => (user && db) ? doc(db, 'users', user.uid) : null, [user, db]);
  const { data: profile, loading: profileLoading } = useDoc(userDocRef);

  const resetQuery = useMemoFirebase(() => {
    if (!db || !user || authLoading) return null;
    return query(collection(db, "password_reset_requests"), where("userId", "==", user.uid));
  }, [db, user, authLoading]);
  const { data: rawResets } = useCollection(resetQuery);

  useEffect(() => {
    if (rawResets && rawResets.length > 0) {
      setForcingChange(rawResets.some((r: any) => r.mustChangePassword === true));
    }
  }, [rawResets]);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user || authLoading) return null;
    return query(collection(db, 'orders'), where('userId', '==', user.uid));
  }, [db, user, authLoading]);
  const { data: rawOrders = [], loading: ordersLoading } = useCollection(ordersQuery);

  const pricingRef = useMemoFirebase(() => db ? doc(db, 'system_metadata', 'pricing_config') : null, [db]);
  const resellerRef = useMemoFirebase(() => db ? doc(db, 'system_metadata', 'reseller_config') : null, [db]);
  const { data: pricing } = useDoc(pricingRef);
  const { data: resellerConfig } = useDoc(resellerRef);

  const globalMarkup = pricing?.globalMarkup ?? 25;
  const resellerDiscount = resellerConfig?.discountPercentage ?? 10;
  const isResellerDiscountEnabled = resellerConfig?.enabled ?? true;

  // Real-time Calculations
  const allOrders = useMemo(() => {
    return [...rawOrders].sort((a: any, b: any) => {
      const tA = a.createdAt?.toMillis?.() || 0;
      const tB = b.createdAt?.toMillis?.() || 0;
      return tB - tA;
    });
  }, [rawOrders]);

  const recentOrders = useMemo(() => allOrders.slice(0, 5), [allOrders]);

  const filteredCategories = useMemo(() => {
    let cats = Array.from(new Set(services.map(s => s.category)));
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      cats = cats.filter(c => c.toLowerCase().includes(lower));
    }
    return cats.sort();
  }, [services, searchQuery]);

  const filteredServicesList = useMemo(() => services.filter(s => s.category === category), [services, category]);
  const selectedService = useMemo(() => services.find(s => s.id === selectedServiceId), [services, selectedServiceId]);

  const getDynamicPrice = useCallback((providerRate: number) => {
    const customerRate = providerRate * (1 + globalMarkup / 100);
    if (profile?.role === 'reseller' && isResellerDiscountEnabled) {
      return customerRate * (1 - resellerDiscount / 100);
    }
    return customerRate;
  }, [globalMarkup, profile?.role, resellerDiscount, isResellerDiscountEnabled]);

  const orderCharge = useMemo(() => {
    if (!selectedService || !quantity) return 0;
    const q = parseInt(quantity);
    if (isNaN(q)) return 0;
    const rate = getDynamicPrice(parseFloat(selectedService.rate));
    return Number(((rate / 1000) * q).toFixed(2));
  }, [selectedService, quantity, getDynamicPrice]);

  // Handlers
  const handleCurrencyChange = useCallback((val: string) => {
    const code = val as CurrencyCode;
    setCurrency(code);
    localStorage.setItem('zennsmm_currency', code);
  }, []);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !selectedService || !link || !quantity) return;
    
    const q = parseInt(quantity);
    if (q < parseInt(selectedService.min) || q > parseInt(selectedService.max)) {
      toast({ title: "Quantity Error", description: `Minimum ${selectedService.min}, Maximum ${selectedService.max}`, variant: "destructive" });
      return;
    }

    if ((profile?.balance || 0) < orderCharge) {
      toast({ title: "Insufficient Balance", description: "Please add funds to your wallet.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        serviceId: selectedService.serviceId,
        serviceName: selectedService.name,
        link,
        quantity: q,
        charge: orderCharge,
        status: 'pending',
        userRole: profile?.role || 'user',
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'users', user.uid), {
        balance: increment(-orderCharge),
        totalSpent: increment(orderCharge),
        totalOrders: increment(1)
      });

      toast({ title: "Success", description: "Order placed successfully." });
      setLink("");
      setQuantity("");
    } catch (err: any) {
      toast({ title: "Submission Failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 rounded-2xl border-slate-100" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl animate-in fade-in duration-700">
      {forcingChange && <ForcePasswordChange onComplete={() => setForcingChange(false)} />}

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black mb-1">
          Control <span className="text-primary">Dashboard</span>
        </h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Authenticated Terminal Access</p>
      </div>

      {/* --- DASHBOARD SUMMARY (5 CARDS) --- */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-10">
        <Card className="reference-card flex flex-col justify-center min-h-[100px]">
          <div className="flex items-center gap-1.5 mb-1">
            <Wallet className="h-3.5 w-3.5 text-primary" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Balance</p>
          </div>
          <p className="text-lg font-black text-primary">{mounted ? formatPrice(profile?.balance || 0, currency) : '...'}</p>
        </Card>

        <Card className="reference-card flex flex-col justify-center min-h-[100px]">
          <div className="flex items-center gap-1.5 mb-1">
            <Star className="h-3.5 w-3.5 text-primary" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Pricing Tier</p>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-sm font-black uppercase text-[#111827]">
              {profile?.role === 'reseller' ? 'Reseller' : 'Retail Customer'}
            </span>
            {profile?.role === 'reseller' && <Badge className="h-4 px-1.5 bg-green-500 text-[8px] font-black uppercase rounded-sm border-0">-Disc Active</Badge>}
          </div>
        </Card>

        <Card className="reference-card flex flex-col justify-center min-h-[100px]">
          <div className="flex items-center gap-1.5 mb-1">
            <ShoppingCart className="h-3.5 w-3.5 text-primary" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Orders</p>
          </div>
          <p className="text-lg font-black text-[#111827]">{profile?.totalOrders || 0}</p>
        </Card>

        <Card className="reference-card flex flex-col justify-center min-h-[100px]">
          <div className="flex items-center gap-1.5 mb-1">
            <CreditCard className="h-3.5 w-3.5 text-primary" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Spent</p>
          </div>
          <p className="text-lg font-black text-[#111827]">{mounted ? formatPrice(profile?.totalSpent || 0, currency) : '...'}</p>
        </Card>

        <Card className="reference-card flex flex-col justify-center min-h-[100px]">
          <div className="flex items-center gap-1.5 mb-1">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Account Status</p>
          </div>
          <Badge variant="outline" className={cn(
            "w-fit h-5 px-2 text-[9px] font-black uppercase border-0 rounded-sm",
            profile?.status === 'suspended' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
          )}>
            {profile?.status || 'Active'}
          </Badge>
        </Card>
      </div>

      {/* --- RECENT ORDERS LEDGER --- */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-black uppercase tracking-widest text-[#111827]">Fulfillment Queue</h3>
          </div>
          <Link href="/orders" className="text-[9px] font-black text-primary uppercase hover:underline">View History</Link>
        </div>
        
        <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white">
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-50">
                  <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-6 py-4">Service</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentOrders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-slate-50/30 transition-colors h-16">
                      <td className="px-6 py-4">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[8px] font-mono font-bold text-slate-300 uppercase truncate">#{order.id.slice(-6).toUpperCase()}</span>
                          <span className="text-[11px] font-black text-slate-900 line-clamp-1">{order.serviceName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={cn(
                          "h-5 px-1.5 text-[8px] font-black uppercase rounded-sm border-0",
                          order.status === 'completed' ? 'bg-green-50 text-green-600' : 
                          order.status === 'processing' ? 'bg-blue-50 text-blue-600' : 'bg-yellow-50 text-yellow-600'
                        )}>{order.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[11px] font-black text-[#111827]">{mounted ? formatPrice(order.charge, currency) : '...'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-slate-300 font-bold uppercase text-[9px] tracking-widest">No active campaigns recorded</div>
          )}
        </Card>
      </div>

      {/* --- CATALOG / PLACE ORDER ENGINE --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-black uppercase tracking-widest text-[#111827]">Order Launchpad</h3>
          </div>
          
          <div className="bg-white border border-[#A855F7]/30 rounded-[28px] p-6 sm:p-8 shadow-sm">
            <form onSubmit={handleSubmitOrder} className="space-y-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input 
                    placeholder="Quick search catalog..." 
                    className="reference-input pl-10 h-11"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="w-[85px]">
                  <Select value={currency} onValueChange={handleCurrencyChange}>
                    <SelectTrigger className="reference-input px-2 h-11 text-[10px] font-black"><SelectValue /></SelectTrigger>
                    <SelectContent position="popper" className="dropdown-list-compact">
                      {Object.keys(CURRENCIES).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="reference-label">PLATFORM CATEGORY</label>
                <Select value={category} onValueChange={(v) => { setCategory(v); setSelectedServiceId(""); }}>
                  <SelectTrigger className="reference-input h-12"><SelectValue placeholder="Select Platform" /></SelectTrigger>
                  <SelectContent position="popper" className="dropdown-list-compact">
                    {filteredCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        <div className="category-option">
                          <PlatformIcon name={cat} className="h-4 w-4 mt-0.5" />
                          <span>{cat}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="reference-label">SERVICE PACKAGE</label>
                <Select value={selectedServiceId} onValueChange={setSelectedServiceId} disabled={!category}>
                  <SelectTrigger className="reference-input h-auto min-h-[48px] py-2"><SelectValue placeholder="Select Service" /></SelectTrigger>
                  <SelectContent position="popper" className="dropdown-list-compact">
                    {filteredServicesList.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="package-option">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <PlatformIcon name={s.name} className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            <span className="package-title">{s.name}</span>
                          </div>
                          <span className="package-price">
                            {mounted ? formatPrice(getDynamicPrice(parseFloat(s.rate)), currency) : s.rate}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedService && <ServiceDescription service={selectedService} />}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="reference-label">TARGET URL / LINK</label>
                  <input placeholder="https://..." className="reference-input h-12" value={link} onChange={(e) => setLink(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="reference-label">ORDER QUANTITY</label>
                  <input type="number" placeholder="0" className="reference-input h-12" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
              </div>

              {selectedService && (
                <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl space-y-2 animate-in fade-in">
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
                    <span>Retail Price (per 1000)</span>
                    <span className="font-black">₹{(parseFloat(selectedService.rate) * (1 + globalMarkup / 100)).toFixed(2)}</span>
                  </div>
                  {profile?.role === 'reseller' && isResellerDiscountEnabled && (
                    <div className="flex justify-between items-center text-[11px] font-black text-green-600 border-t border-green-100/30 pt-2">
                      <span className="flex items-center gap-1.5"><Star className="h-3 w-3" /> Reseller Discount</span>
                      <span>-{resellerDiscount}% Applied</span>
                    </div>
                  )}
                </div>
              )}

              <div className="p-5 bg-slate-900 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Final Fulfillment Cost</p>
                  <p className="text-2xl font-black text-white">{mounted ? formatPrice(orderCharge, currency) : '...'}</p>
                </div>
                <Button 
                  onClick={handleSubmitOrder} 
                  disabled={submitting || !selectedServiceId || !link || !quantity}
                  className="reference-button h-12 px-8 w-full sm:w-auto text-[11px] rounded-xl"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShoppingCart className="h-4 w-4 mr-2" /> Commit Order</>}
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
           <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-black uppercase tracking-widest text-[#111827]">Security Vault</h3>
          </div>
          
          <Card className="bg-primary/5 border border-primary/20 rounded-[28px] p-8 text-center relative overflow-hidden group">
            <div className="relative z-10">
              <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 mx-auto border border-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h4 className="text-lg font-black mb-2 text-[#111827]">Need High Volume?</h4>
              <p className="text-[12px] text-slate-500 font-bold leading-relaxed mb-6">
                Our support desk is standing by for API integrations and custom white-label solutions.
              </p>
              <Link href="/contact" className="block">
                <Button variant="outline" className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px] border-primary/20 text-primary hover:bg-primary/5">Open Support Ticket</Button>
              </Link>
            </div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl opacity-50" />
          </Card>

          <Card className="bg-white border border-slate-100 rounded-[28px] p-6 space-y-4 shadow-sm">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identity Details</h4>
             <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                   <span className="text-[11px] font-bold text-slate-400 uppercase">System UID</span>
                   <span className="text-[11px] font-mono font-bold text-[#111827]">{user?.uid.slice(0, 10)}...</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                   <span className="text-[11px] font-bold text-slate-400 uppercase">Gateway Node</span>
                   <span className="text-[11px] font-black text-green-600 uppercase">Secure Optimized</span>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-[11px] font-bold text-slate-400 uppercase">Auth Method</span>
                   <span className="text-[11px] font-black text-[#111827] uppercase">Credentialed</span>
                </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
