
"use client";

import React, { useState } from "react";
import { useAuth, useFirestore } from '@/firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { doc, updateDoc, query, collection, where, getDocs } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Lock, AlertCircle, Loader2, ShieldAlert } from "lucide-react";

export default function ForcePasswordChange({ onComplete }: { onComplete: () => void }) {
  const [tempPassword, setTempPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const auth = useAuth();
  const db = useFirestore();

  const handleChange = async () => {
    if (!auth?.currentUser || !db) return;
    setError("");

    if (!tempPassword || !newPassword || !confirmPassword) {
      setError("All fields are required."); return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters."); return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match."); return;
    }
    if (newPassword === tempPassword) {
      setError("New password must be different from temporary password."); return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email!, tempPassword);
      
      // Verification
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      // Cleanup Flag in requests collection
      const q = query(
        collection(db, "password_reset_requests"),
        where("userId", "==", user.uid),
        where("mustChangePassword", "==", true)
      );
      const snap = await getDocs(q);
      const updates = snap.docs.map(d => 
        updateDoc(doc(db, "password_reset_requests", d.id), {
          mustChangePassword: false,
          status: "completed"
        })
      );
      await Promise.all(updates);
      
      onComplete();
    } catch (err: any) {
      console.error("[ForcePasswordChange] Error:", err);
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Temporary password is incorrect.");
      } else if (err.code === "auth/weak-password") {
        setError("Password too weak. Use at least 8 characters.");
      } else {
        setError("Failed to update password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl rounded-[2.5rem] border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        <CardHeader className="p-8 bg-slate-50/50 border-b text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold">Update Password</CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-60">Security Protocol Required</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-5">
          <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-orange-800 font-bold leading-relaxed">
              You are using a temporary password. You must create a new secure password before you can access your dashboard.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2 text-red-600 text-[11px] font-bold">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Current Temporary Password</label>
              <PasswordInput value={tempPassword} onChange={e => setTempPassword(e.target.value)} disabled={loading} className="h-11 bg-slate-50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">New Secure Password</label>
              <PasswordInput value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={loading} className="h-11 bg-slate-50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Confirm New Password</label>
              <PasswordInput value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={loading} className="h-11 bg-slate-50" />
            </div>
          </div>

          <Button 
            className="w-full h-14 bg-primary hover:bg-primary/90 font-bold rounded-2xl shadow-xl shadow-primary/20"
            onClick={handleChange}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Save Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
