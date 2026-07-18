"use client";

import React, { useState } from "react";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, Timestamp, limit } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, MessageSquare, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WHATSAPP_NUMBER = "919509013634";

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export default function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const db = useFirestore();
  const { toast } = useToast();

  const openWhatsApp = (emailAddr: string) => {
    const message = `Hello ZennSMM,\n\nCan you provide a temporary password for login?\n\nEmail: ${emailAddr}\n\nThank you.`;
    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, "_blank", "noopener,noreferrer");
  };

  const handleSubmit = async () => {
    if (!db) return;
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      // 1. Check for existing pending request (Simplified query to avoid index error)
      const q = query(
        collection(db, "password_reset_requests"),
        where("email", "==", trimmedEmail),
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

      if (pendingRequests.length > 0) {
        setError("A request is already pending. Please wait or contact support via WhatsApp.");
        setLoading(false);
        return;
      }

      // 2. Look up the user's UID (optional)
      let userId = "unknown";
      const usersQuery = query(collection(db, "users"), where("email", "==", trimmedEmail), limit(1));
      const usersSnap = await getDocs(usersQuery);
      if (!usersSnap.empty) {
        userId = usersSnap.docs[0].id;
      }

      // 3. Save the request
      await addDoc(collection(db, "password_reset_requests"), {
        email: trimmedEmail,
        userId: userId,
        status: "pending",
        temporaryPassword: null,
        mustChangePassword: false,
        createdAt: serverTimestamp(),
        completedAt: null,
      });

      setSubmitted(true);
      openWhatsApp(trimmedEmail);

      toast({
        title: "Request Sent",
        description: "Your recovery ticket is saved. WhatsApp redirect initiated.",
      });
    } catch (err: any) {
      console.error("[ForgotPassword] Error:", err);
      
      if (err.code === "permission-denied") {
        setError("Server check restricted, but you can still contact support via WhatsApp.");
        setSubmitted(true); 
        openWhatsApp(trimmedEmail);
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-black uppercase tracking-tight">Reset Password</h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {!submitted ? (
        <>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Enter your registered email. We'll verify your profile and connect you to support via WhatsApp.
          </p>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2 text-red-600 text-[11px] font-bold leading-tight mb-4">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">
                Email Address
              </Label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="h-11 bg-slate-50 border-transparent focus:bg-white font-bold"
                disabled={loading}
              />
            </div>

            <Button
              className="w-full h-12 bg-primary hover:bg-primary/90 font-bold rounded-xl shadow-lg shadow-primary/20"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Get Temporary Password"}
            </Button>

            <Button
              variant="ghost"
              className="w-full text-xs font-bold uppercase tracking-widest text-muted-foreground"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-8 space-y-6">
          <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
            <MessageSquare className="h-8 w-8 text-green-500" />
          </div>
          <div>
            <h3 className="text-lg font-black mb-1">Request Submitted!</h3>
            <p className="text-sm text-muted-foreground">
              WhatsApp should open automatically. If not, use the button below.
            </p>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
              `Hello ZennSMM,\n\nCan you provide a temporary password for login?\n\nEmail: ${email}\n\nThank you.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button className="w-full h-12 bg-[#25D366] hover:bg-[#128C7E] font-bold rounded-xl gap-2">
              <MessageSquare className="h-4 w-4" /> Open WhatsApp
            </Button>
          </a>
          <Button variant="ghost" className="w-full text-xs font-bold uppercase tracking-widest" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
