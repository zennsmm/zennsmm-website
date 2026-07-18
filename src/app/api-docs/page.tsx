"use client";

import { useEffect } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function ApiDocsPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

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

  const codeExample = `{
  "key": "YOUR_API_KEY",
  "action": "add",
  "service": 1,
  "link": "https://example.com/p/123",
  "quantity": 1000
}`;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 max-w-5xl">
      <div className="mb-12">
        <h1 className="font-headline text-4xl font-bold mb-4">API Documentation</h1>
        <p className="text-muted-foreground">Integrate zennsmm directly into your applications or panels.</p>
      </div>

      <div className="space-y-12">
        <section className="glass-card p-8 rounded-2xl">
          <h2 className="text-2xl font-bold mb-4">Base URL</h2>
          <div className="bg-black/40 p-4 rounded-xl font-mono text-primary text-sm break-all">
            https://zennsmm.com/api/v2
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold">API Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="font-bold text-primary mb-2">Service List</h3>
              <p className="text-sm text-muted-foreground mb-4">Retrieve all available services and rates.</p>
              <div className="text-xs font-mono bg-black/30 p-3 rounded-lg text-white/70">GET /?key=API_KEY&action=services</div>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="font-bold text-primary mb-2">Add Order</h3>
              <p className="text-sm text-muted-foreground mb-4">Place a new order on the platform.</p>
              <div className="text-xs font-mono bg-black/30 p-3 rounded-lg text-white/70">POST /?key=API_KEY&action=add&...</div>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="font-bold text-primary mb-2">Order Status</h3>
              <p className="text-sm text-muted-foreground mb-4">Check status of a specific order.</p>
              <div className="text-xs font-mono bg-black/30 p-3 rounded-lg text-white/70">GET /?key=API_KEY&action=status&order=ID</div>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="font-bold text-primary mb-2">User Balance</h3>
              <p className="text-sm text-muted-foreground mb-4">Get current account balance in INR.</p>
              <div className="text-xs font-mono bg-black/30 p-3 rounded-lg text-white/70">GET /?key=API_KEY&action=balance</div>
            </div>
          </div>
        </section>

        <section className="glass-card p-8 rounded-2xl">
          <h2 className="text-2xl font-bold mb-4">Example Request (Add Order)</h2>
          <pre className="bg-black/40 p-6 rounded-xl font-mono text-sm overflow-x-auto text-primary/80">
            {codeExample}
          </pre>
        </section>
      </div>
    </div>
  );
}
