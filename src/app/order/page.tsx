
"use client";

import { useState, useMemo, useEffect, Suspense, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { collection, doc, query, serverTimestamp, addDoc, updateDoc, increment, getDocs } from 'firebase/firestore';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Zap,
  Loader2,
  SearchIcon,
  Wallet,
  Star,
  ChevronDown,
  ClipboardList,
  Clock,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Instagram,
  Facebook,
  Youtube,
  Send,
  Twitter,
  ShoppingCart,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CURRENCIES, CurrencyCode, DEFAULT_CURRENCY, formatPrice } from '@/lib/currency';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

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
  if (n.includes('twitter') || n.includes(' x ') || n.includes(' x') || n.endsWith(' x')) return <Twitter className={cn("text-[#000000]", className)} />;
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
          <span className="text-[10px] font-black uppercase tracking-wider text-[#111827]">Performance Spec</span>
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

        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2.5 bg-orange-50/50 border border-orange-100 rounded-xl text-[9px] font-black uppercase text-orange-600 hover:bg-orange-50 transition-colors group">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3 w-3" /> Safety Guidelines
            </div>
            <ChevronDown className="h-3 w-3 group-data-[state=open]:rotate-180 transition-transform" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 text-[11px] text-[#4B5563] font-bold space-y-1 px-1">
            <p>• Account must be Public.</p>
            <p>• No double ordering.</p>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

function OrderFormContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();

  const isOrderPage = pathname === '/order';

  const [services, setServices] = useState<SMMService[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [mounted, setMounted] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // FETCH CONFIGS
  const pricingRef = useMemoFirebase(() => db ? doc(db, 'system_metadata', 'pricing_config') : null, [db]);
  const resellerRef = useMemoFirebase(() => db ? doc(db, 'system_metadata', 'reseller_config') : null, [db]);
  const userDocRef = useMemo(() => (user && db ? doc(db, 'users', user.uid) : null), [user, db]);
  
  const { data: pricing } = useDoc(pricingRef);
  const { data: resellerConfig } = useDoc(resellerRef);
  const { data: profile } = useDoc(userDocRef);

  const globalMarkup = pricing?.globalMarkup ?? 25;
  const resellerDiscount = resellerConfig?.discountPercentage ?? 10;
  const isResellerDiscountEnabled = resellerConfig?.enabled ?? true;

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
        console.error("[Order] Services sync failed", err);
      } finally {
        setLoadingServices(false);
      }
    };

    preloadServices();
  }, [db]);

  useEffect(() => {
    if (!authLoading && !user && isOrderPage) {
      toast({ title: "Access Denied", description: "Please sign in.", variant: "destructive" });
      router.replace('/login');
    }
  }, [user, authLoading, router, toast, isOrderPage]);

  const handleCurrencyChange = useCallback((val: string) => {
    const code = val as CurrencyCode;
    setCurrency(code);
    localStorage.setItem('zennsmm_currency', code);
  }, []);

  const filteredCategories = useMemo(() => {
    let cats = Array.from(new Set(services.map(s => s.category)));
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      cats = cats.filter(c => c.toLowerCase().includes(lower));
    }
    return cats.sort();
  }, [services, searchQuery]);

  const filteredServicesList = useMemo(() => 
    services.filter(s => s.category === category), 
  [services, category]);

  const selectedService = useMemo(() => 
    services.find(s => s.id === selectedServiceId), 
  [services, selectedServiceId]);

  const getDynamicPrice = useCallback((providerRate: number) => {
    const customerRate = providerRate * (1 + globalMarkup / 100);
    
    if (profile?.role === 'reseller' && isResellerDiscountEnabled) {
      const discountedRate = customerRate * (1 - resellerDiscount / 100);
      return discountedRate;
    }
    
    return customerRate;
  }, [globalMarkup, profile?.role, resellerDiscount, isResellerDiscountEnabled]);

  const charge = useMemo(() => {
    if (!selectedService || !quantity) return 0;
    const q = parseInt(quantity);
    if (isNaN(q)) return 0;
    
    const finalRate = getDynamicPrice(parseFloat(selectedService.rate));
    const rawCharge = (finalRate / 1000) * q;
    return Number(rawCharge.toFixed(2));
  }, [selectedService, quantity, getDynamicPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setShowAuthModal(true); return; }
    if (!selectedService || !link || !quantity || !db) return;
    
    const q = parseInt(quantity);
    if (q < parseInt(selectedService.min) || q > parseInt(selectedService.max)) {
      toast({ title: "Limit Error", variant: "destructive" });
      return;
    }
    
    if ((profile?.balance || 0) < charge) {
      toast({ title: "Add Funds", description: "Insufficient wallet balance.", variant: "destructive" });
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
        charge,
        status: 'pending',
        userRole: profile?.role || 'user',
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'users', user.uid), {
        balance: increment(-charge),
        totalSpent: increment(charge),
        totalOrders: increment(1)
      });

      toast({ title: "Order Placed" });
      router.push('/orders');
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading && isOrderPage) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container mx-auto px-3 py-6 max-w-2xl">
      <Dialog open={showAuthModal} onValueChange={setShowAuthModal}>
        <DialogContent className="max-w-md rounded-[2rem]">
          <div className="text-center p-6">
            <ShieldCheck className="mx-auto h-12 w-12 text-primary mb-4" />
            <h2 className="text-xl font-black uppercase mb-2">Login Required</h2>
            <p className="text-sm text-slate-500 mb-6">Please authenticate to place an order.</p>
            <div className="grid gap-2">
              <Link href="/login"><Button className="w-full h-12 rounded-xl">Sign In</Button></Link>
              <Link href="/register"><Button variant="outline" className="w-full h-12 rounded-xl">Create Account</Button></Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mb-6">
        <h1 className="text-3xl font-black mb-2">New Order</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn(
            "h-6 px-3 font-black uppercase text-[10px] tracking-wider border-slate-200",
            profile?.role === 'reseller' && "bg-primary/10 text-primary border-primary/20"
          )}>
            {profile?.role === 'reseller' ? '★ Reseller' : 'Retail Customer'}
          </Badge>
          {profile?.role === 'reseller' && isResellerDiscountEnabled && (
            <Badge className="bg-green-100 text-green-700 border-0 h-6 px-3 font-black uppercase text-[10px] tracking-wider">
              <Zap className="h-3 w-3 mr-1.5" /> Discount Active
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-8">
        <div className="reference-card flex flex-col justify-center min-h-[72px]">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Wallet className="h-3.5 w-3.5 text-primary" />
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Balance</p>
          </div>
          <p className="text-base font-black text-primary">{mounted ? formatPrice(profile?.balance || 0, currency) : '...'}</p>
        </div>

        <div className="reference-card flex flex-col justify-center min-h-[72px]">
          <div className="flex items-center gap-1.5 mb-0.5">
            <CreditCard className="h-3.5 w-3.5 text-primary" />
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Total Spend</p>
          </div>
          <p className="text-base font-black text-[#111827]">{mounted ? formatPrice(profile?.totalSpent || 0, currency) : '...'}</p>
        </div>

        <div className="reference-card flex flex-col justify-center min-h-[72px]">
          <div className="flex items-center gap-1.5 mb-0.5">
            <ShoppingCart className="h-3.5 w-3.5 text-primary" />
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Total Orders</p>
          </div>
          <p className="text-base font-black text-[#111827]">{profile?.totalOrders || 0}</p>
        </div>

        <div className="reference-card flex flex-col justify-center min-h-[72px]">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Star className="h-3.5 w-3.5 text-primary" />
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Pricing Tier</p>
          </div>
          <p className="text-[10px] font-black text-[#111827] uppercase leading-tight">
            {profile?.role === 'reseller' ? 'Reseller' : 'Retail'}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <input placeholder="Search platform or service..." className="reference-input pl-10 h-11" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="w-[85px]">
          <Select value={currency} onValueChange={handleCurrencyChange}>
            <SelectTrigger className="w-full reference-input px-2 h-11 text-[10px] font-black"><SelectValue /></SelectTrigger>
            <SelectContent position="popper" sideOffset={4} className="dropdown-list-compact">
              {Object.keys(CURRENCIES).map(c => <SelectItem key={c} value={c} className="text-xs font-bold">{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white border border-[#A855F7] rounded-[24px] p-4 sm:p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="reference-label">CATEGORY</label>
            <Select value={category} onValueChange={(v) => { setCategory(v); setSelectedServiceId(""); }}>
              <SelectTrigger className="reference-input h-[48px] overflow-hidden"><SelectValue placeholder="Select Platform" /></SelectTrigger>
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
            <label className="reference-label">PACKAGE</label>
            <Select value={selectedServiceId} onValueChange={setSelectedServiceId} disabled={!category}>
              <SelectTrigger className="reference-input h-auto min-h-[48px] py-2 overflow-hidden"><SelectValue placeholder="Choose Package" /></SelectTrigger>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="reference-label">TARGET LINK</label>
              <input placeholder="https://..." className="reference-input h-11" value={link} onChange={(e) => setLink(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="reference-label">QUANTITY</label>
              <input type="number" placeholder="0" className="reference-input h-11" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
          </div>

          {selectedService && (
            <div className="p-5 bg-primary/5 border border-primary/20 rounded-[20px] space-y-4 animate-in fade-in slide-in-from-top-2">
                {profile?.role === 'reseller' ? (
                  <>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary border-b border-primary/10 pb-2 mb-2">Price Information</p>
                    <div className="flex justify-between items-center text-[12px] font-bold text-slate-500">
                      <span>Customer Rate:</span>
                      <span className="font-black">
                        {mounted ? formatPrice(parseFloat(selectedService.rate) * (1 + globalMarkup / 100), currency) : '...'} / 1000
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[12px] font-black text-green-600 bg-green-50/50 p-2 rounded-lg border border-green-100/50">
                      <span className="flex items-center gap-1.5"><Zap className="h-3 w-3" /> Reseller Rate:</span>
                      <span>
                        {mounted ? formatPrice((parseFloat(selectedService.rate) * (1 + globalMarkup / 100)) * (1 - resellerDiscount / 100), currency) : '...'} / 1000
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center text-[12px] font-black text-slate-700">
                    <span>Price:</span>
                    <span>
                      {mounted ? formatPrice(parseFloat(selectedService.rate) * (1 + globalMarkup / 100), currency) : '...'} / 1000
                    </span>
                  </div>
                )}

                <div className="space-y-1 pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Average Time:</p>
                  <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                    Usually starts instantly. During heavy server load, delivery may take up to 24 hours.
                  </p>
                </div>
            </div>
          )}

          {charge > 0 && (
            <div className="p-5 bg-[#111827] rounded-[20px] flex justify-between items-center animate-in zoom-in-95">
               <div className="space-y-0.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Final Order Cost</span>
                  <p className="text-2xl font-black text-white leading-none">
                    {mounted ? formatPrice(charge, currency) : '...'}
                  </p>
               </div>
               <Button type="submit" disabled={submitting} className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[11px] rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                 {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : <><ShoppingCart className="mr-2 h-4 w-4" /> Checkout</>}
               </Button>
            </div>
          )}

          {!charge && (
            <button type="submit" disabled={submitting || !selectedServiceId || !link || !quantity} className={cn("reference-button h-14 flex items-center justify-center gap-2", !user && "bg-slate-900")}>
              {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : user ? "Place Order Now" : "Sign In to Order"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <OrderFormContent />
    </Suspense>
  );
}
