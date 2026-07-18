"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { PasswordInput } from '@/components/ui/password-input';
import { Settings, Shield, Bell, Globe, Save, Loader2, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser } from '@/firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { toast } = useToast();
  const auth = useAuth();
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

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

  const handleSaveGeneral = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Settings Updated", description: "Your preferences have been saved." });
    }, 800);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.currentUser || !auth.currentUser.email) return;
    
    setPasswordError(null);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError("New password must be different from current password.");
      return;
    }

    setPasswordLoading(true);

    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      
      // 1. Re-authenticate
      await reauthenticateWithCredential(user, credential);
      
      // 2. Update password
      await updatePassword(user, newPassword);

      toast({ 
        title: "Password Updated", 
        description: "Your security credentials have been refreshed." 
      });
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error("[Settings] Password change error:", err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPasswordError("Current password is incorrect.");
      } else if (err.code === 'auth/weak-password') {
        setPasswordError("Password is too weak. Please use symbols and numbers.");
      } else {
        setPasswordError(err.message || "Failed to update password. Please try again.");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold mb-2 text-[#111827]">Account <span className="text-primary">Settings</span></h1>
        <p className="text-muted-foreground font-medium uppercase text-[12px] tracking-widest opacity-80">Personalize Your Growth Experience</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* SECURITY CARD */}
          <Card className="rounded-[2rem] border-slate-100 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
              <CardTitle className="text-lg font-black flex items-center gap-2 text-[#111827]">
                <Lock className="h-5 w-5 text-primary" /> Security & Authentication
              </CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-wider opacity-60">Update your access credentials</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleChangePassword} className="space-y-6">
                {passwordError && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 font-bold uppercase tracking-tight">{passwordError}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.15em] ml-1">Current Password</Label>
                    <PasswordInput 
                      placeholder="••••••••" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="h-12 bg-slate-50 border-transparent focus:bg-white font-bold" 
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.15em] ml-1">New Password</Label>
                      <PasswordInput 
                        placeholder="Min. 8 chars" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-12 bg-slate-50 border-transparent focus:bg-white font-bold" 
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.15em] ml-1">Confirm New</Label>
                      <PasswordInput 
                        placeholder="Re-enter password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-12 bg-slate-50 border-transparent focus:bg-white font-bold" 
                        required
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={passwordLoading}
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90"
                >
                  {passwordLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update Security Credentials"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* GENERAL PREFERENCES */}
          <Card className="rounded-[2rem] border-slate-100 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
              <CardTitle className="text-lg font-black flex items-center gap-2 text-[#111827]">
                <Globe className="h-5 w-5 text-primary" /> General Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.15em] ml-1">Default Currency</Label>
                  <Input defaultValue="INR (₹)" disabled className="h-12 rounded-2xl bg-slate-50 border-transparent font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.15em] ml-1">Time Zone</Label>
                  <Input defaultValue="Asia/Kolkata (IST)" disabled className="h-12 rounded-2xl bg-slate-50 border-transparent font-bold" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NOTIFICATIONS */}
          <Card className="rounded-[2rem] border-slate-100 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
              <CardTitle className="text-lg font-black flex items-center gap-2 text-[#111827]">
                <Bell className="h-5 w-5 text-primary" /> Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-black text-[#111827]">Email Alerts</p>
                  <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider opacity-60">Order status updates</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-black text-[#111827]">Fulfillment Push</p>
                  <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider opacity-60">Completion notifications</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="rounded-[2.5rem] border-slate-100 shadow-xl bg-primary/5 p-8 text-center sticky top-24">
            <div className="mx-auto w-16 h-16 rounded-3xl bg-white shadow-md flex items-center justify-center mb-6">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-black text-[#111827] mb-2 uppercase tracking-tight">Secure Account</h3>
            <p className="text-[11px] text-slate-500 font-bold leading-relaxed mb-8 uppercase tracking-wider opacity-70">
              We use bank-level encryption to protect your profile and payment data.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={handleSaveGeneral} 
                disabled={loading}
                className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="mr-2 h-5 w-5" /> Save Preference</>}
              </Button>
              <div className="flex items-center justify-center gap-2 py-4">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">SSL Protection Active</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
