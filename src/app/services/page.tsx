"use client";

import { Suspense } from 'react';
import OrderPage from '../order/page';

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh] text-sm font-bold text-primary animate-pulse uppercase tracking-widest">Loading Order Form...</div>}>
      <OrderPage />
    </Suspense>
  );
}
