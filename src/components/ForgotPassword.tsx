"use client";

import React, { useState } from "react";
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, Timestamp, limit } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { ShieldCheck, MessageSquare, AlertCircle, ArrowLeft, Loader2, X } from "lucide-react";

const WHATSAPP_NUMBER = "919509013634";

interface ForgotPasswordProps {
  onBack: () => void;
}

export default function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const db = useFirestore();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async () => {
    if (!db) return;
    setError("");

    const sanitizedEmail = email.trim().toLowerCase();

    if (!validateEmail(sanitizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      // 1. Check for existing pending request (Simplified query to avoid index error)
      const q = query(
        collection(db, "password_reset_requests"),
        where("email", "==", sanitizedEmail),
        limit(20)
      );
      
      const existing = await getDocs(q);
      const pendingRequests = existing.docs
        .map(doc => doc.data())
        .filter(item => item.status === "pending")
        .sort((a: any, b: any) => {
          const aTime = (a.createdAt as Timestamp)?.toMillis?.() || 0;
          const bTime = (b.createdAt as Timestamp)?.toMillis?.() || 0;
          return bTime - aTime;
        });

      const lastRequest = pendingRequests[0];
      if (lastRequest) {
        const createdAt = (lastRequest.createdAt as Timestamp)?.toMillis() || Date.now();
        const cooldownMs = 5 * 60 * 1000;
        
        if (Date.now() - createdAt < cooldownMs) {
          setError("A request is already pending. Please wait 5 minutes or contact support.");
          setLoading(false);
          return;
        }
      }

      // 2. Create new request
      await addDoc(collection(db, "password_reset_requests"), {
        email: sanitizedEmail,
        userId: "unknown", // To be updated by admin or logic
        status: "pending",
        temporaryPassword: null,
        createdAt: serverTimestamp(),
        completedAt: null,
      });

      setSubmitted(true);

      // 3. WhatsApp Redirect
      const message = `Hello ZennSMM,\n\nCan you provide a temporary password for login?\n\nEmail: ${sanitizedEmail}\n\nThank you.`;
      const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappURL, "_blank", "noopener,noreferrer");

    } catch (err: any) {
      console.error("[ForgotPassword] Error:", err);
      // Fallback for permission issues
      if (err.code === "permission-denied") {
        const message = `Hello ZennSMM,\n\nCan you provide a temporary password for login?\n\nEmail: ${sanitizedEmail}\n\nThank you.`;
        const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(whatsappURL, "_blank", "noopener,noreferrer");
        setSubmitted(true);
      } else {
        setError("Failed to process request. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="w-full max-w-sm bg-white shadow-2xl rounded-[2rem] border-slate-100 overflow-hidden text-center animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="p-8 bg-slate-50/50 border-b">
          <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="h-8 w-8 text-green-500" />
          </div>
          <CardTitle className="text-xl font-bold">Request Sent</CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-60">Fulfillment in Progress</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your identity recovery request is logged. Please wait for an administrator to generate your temporary credential.
          </p>
          <Button variant="outline" className="w-full h-12 rounded-xl font-bold" onClick={onBack}>
            Return to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4 flex items-center justify-center">
      <Card className="w-full max-w-sm bg-white shadow-2xl rounded-[2.25rem] border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <CardHeader className="p-8 bg-slate-50/50 border-b text-center relative">
          <button onClick={onBack} className="absolute right-6 top-6 text-slate-300 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
          <CardTitle className="text-2xl font-black uppercase tracking-tight text-[#111827]">Reset Access</CardTitle>
          <CardDescription className="text-[10px] uppercase tracking-[0.25em] font-black opacity-40">Identity Recovery</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <p className="text-xs text-slate-500 font-bold leading-relaxed text-center uppercase tracking-wider opacity-80">
            Enter your registered email address. We will verify your profile and generate a temporary access key.
          </p>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-red-600 leading-tight">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black text-[#111827] tracking-widest ml-1 opacity-70">Email Address</label>
            <Input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-slate-50/50 border-transparent focus:bg-white font-bold text-sm rounded-xl"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button 
              className="w-full h-14 bg-primary hover:bg-primary/90 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5"
              onClick={handleSubmit}
              disabled={loading || !email}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Get Temporary Password"}
            </Button>
            <Button variant="ghost" onClick={onBack} className="text-[10px] font-black uppercase tracking-widest gap-2 text-slate-400 hover:text-slate-600">
              Cancel Recovery
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
