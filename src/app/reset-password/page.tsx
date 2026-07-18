"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { ShieldCheck, Lock, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  const [email, setEmail] = useState("");
  const [requestId, setRequestId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const force = localStorage.getItem("forcePasswordChange");
    const storedEmail = localStorage.getItem("tempLoginEmail");
    const storedReqId = localStorage.getItem("tempLoginRequestId");

    if (force !== "true" || !storedEmail) {
      router.replace("/login");
    } else {
      setEmail(storedEmail);
      setRequestId(storedReqId || "");
    }
  }, [router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Call API to update password in Firebase Auth via Admin SDK
      const response = await fetch("/api/auth/finalize-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword, requestId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to synchronize credentials.");
      }

      setSuccess(true);
      toast({ title: "Identity Secured", description: "Your new password is now active." });

      // Step 2: Clear temp session data
      localStorage.removeItem("forcePasswordChange");
      localStorage.removeItem("tempLoginEmail");
      localStorage.removeItem("tempLoginRequestId");

      // Step 3: Perform actual Firebase Login with new password
      if (auth) {
        await signInWithEmailAndPassword(auth, email, newPassword);
      }

      // Step 4: Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);

    } catch (err: any) {
      console.error("[ResetFinalize] Error:", err);
      setError(err.message || "Credential synchronization failed.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <Card className="w-full max-w-sm bg-white shadow-2xl rounded-[2.5rem] border-slate-100 overflow-hidden text-center p-12 animate-in zoom-in-95">
          <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-black mb-2 text-[#111827]">Security Synced</h2>
          <p className="text-slate-500 font-bold mb-8 text-sm">Your new credentials are authorized. Redirecting to dashboard...</p>
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4 py-10">
      <Card className="w-full max-w-sm bg-white border border-slate-200/80 shadow-2xl rounded-[2.25rem] overflow-hidden transform hover:scale-[1.005] transition-all duration-500 ease-out">
        <CardHeader className="text-center p-8 bg-slate-50/50 border-b border-slate-100/80">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-[1.25rem] flex items-center justify-center mb-4 shadow-sm border border-primary/5">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black uppercase tracking-tight text-[#111827]">Secure Profile</CardTitle>
          <CardDescription className="text-[10px] uppercase tracking-[0.25em] font-black opacity-40">Identity Finalization</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] text-primary/80 font-bold leading-relaxed">
              Create a permanent secure password for <span className="font-black underline">{email}</span>.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-red-600 leading-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black text-[#111827] tracking-widest ml-1 opacity-70">New Secure Password</Label>
              <PasswordInput 
                placeholder="Min. 8 characters" 
                className="h-11 bg-slate-50/50 border-transparent focus:bg-white font-bold" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black text-[#111827] tracking-widest ml-1 opacity-70">Confirm New Password</Label>
              <PasswordInput 
                placeholder="Re-enter password" 
                className="h-11 bg-slate-50/50 border-transparent focus:bg-white font-bold" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
              />
            </div>
            <Button className="w-full font-black h-14 text-xs bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl mt-4" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save & Secure Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
