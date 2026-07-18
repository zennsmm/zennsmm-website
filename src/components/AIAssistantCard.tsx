"use client";

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, Instagram, Users, Heart, Eye, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AIAssistantCard() {
  const actions = [
    { label: 'Grow Instagram', icon: Instagram },
    { label: 'Increase Followers', icon: Users },
    { label: 'Boost Likes', icon: Heart },
    { label: 'Increase Views', icon: Eye },
    { label: 'Start a New Brand', icon: Rocket },
  ];

  return (
    <div className="container mx-auto px-4 mb-8">
      <div className="relative group">
        {/* Animated Gradient Border Wrapper */}
        <div className="absolute -inset-[1.5px] bg-gradient-to-r from-[#A855F7] via-[#EF4444] to-[#A855F7] rounded-[1.25rem] blur-[2px] opacity-75 group-hover:opacity-100 transition-opacity animate-border-shimmer" />
        
        <div className="relative h-[110px] sm:h-[100px] bg-white rounded-[1.25rem] overflow-hidden flex items-center px-4 sm:px-6">
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 shadow-sm border border-primary/5">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-[#111827] flex items-center gap-1.5">
                  🤖 AI Package Guide
                </h4>
                <p className="text-[12px] text-slate-500 font-bold truncate leading-tight mt-0.5">
                  "New to SMM? Tell me your goal and I'll help you choose."
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 overflow-hidden">
              <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {actions.map((action, i) => (
                  <Link key={i} href="/planner">
                    <button className="whitespace-nowrap px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-tighter transition-colors flex items-center gap-1.5">
                      <action.icon className="h-3 w-3 text-primary" />
                      {action.label}
                    </button>
                  </Link>
                ))}
              </div>

              <Link href="/planner">
                <Button className="h-10 px-6 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:scale-[1.02] active:scale-95 transition-all rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-white">Ask AI</span>
                  <ArrowRight className="h-3.5 w-3.5 text-white" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
