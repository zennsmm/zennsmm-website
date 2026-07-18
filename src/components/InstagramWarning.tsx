"use client";

import React from 'react';
import { AlertCircle, XCircle, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InstagramWarning() {
  return (
    <div className="container mx-auto px-4 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className={cn(
        "relative overflow-hidden bg-red-50/40 border border-red-500/40 rounded-2xl p-4 sm:p-5",
        "shadow-[0_0_15px_rgba(239,68,68,0.1),0_0_30px_rgba(239,68,68,0.05)]",
        "backdrop-blur-sm group hover:scale-[1.005] transition-all duration-300"
      )}>
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="p-2.5 bg-red-100 rounded-xl shrink-0 shadow-sm border border-red-200/50">
            <AlertCircle className="h-5 w-5 text-red-600 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-red-600 flex items-center gap-2">
              🚨 IMPORTANT NOTICE
            </h4>
            
            <div className="space-y-1.5">
              <p className="text-[11px] sm:text-[12px] text-red-900/80 font-bold leading-relaxed">
                Before ordering Instagram Followers, please turn <span className="text-red-700 font-black underline decoration-red-300 underline-offset-2 uppercase">OFF</span> the "<span className="text-red-700 font-black">Flag for Review</span>" option in your Instagram settings.
              </p>
              
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-start gap-2 text-[10px] sm:text-[11px] font-bold text-red-700/70">
                  <span className="mt-0.5">❌</span>
                  <p>If you do not turn <span className="font-black">OFF</span> this option, some followers may not be delivered correctly.</p>
                </div>
                <div className="flex items-start gap-2 text-[10px] sm:text-[11px] font-bold text-red-700/70">
                  <span className="mt-0.5">🚫</span>
                  <p>In that case, <span className="font-black underline decoration-red-300">no refill</span> or <span className="font-black underline decoration-red-300">no guarantee</span> will be provided.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Subtle decorative glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>
    </div>
  );
}
