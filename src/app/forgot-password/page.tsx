"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordPlaceholder() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    toast({
      title: "Coming Soon",
      description: "Password reset feature coming soon.",
    });
    router.replace('/login');
  }, [router, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Redirecting...</p>
    </div>
  );
}
