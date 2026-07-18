
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { KeyRound, CheckCircle, Clock, Copy, Loader2, AlertCircle, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function generateTempPassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  let password = "";
  const array = new Uint32Array(12);
  if (typeof crypto !== 'undefined') {
    crypto.getRandomValues(array);
    for (let i = 0; i < 12; i++) {
      password += chars[array[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return password;
}

async function updateFirebaseAuthPassword(userId: string, tempPassword: string) {
  const response = await fetch("/api/admin/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, tempPassword }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to update auth password");
  }
  return response.json();
}

export default function AdminPasswordResetsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, string | null>>({});
  const [generatedPasswords, setGeneratedPasswords] = useState<Record<string, string>>({});
  const db = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "passwordResetRequests"), orderBy("requestTime", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      setLoading(false);
      console.error(err);
    });
    return () => unsub();
  }, [db]);

  const handleGenerateTempPassword = async (req: any) => {
    if (!db) return;
    setActionLoading(prev => ({ ...prev, [req.id]: "generating" }));
    try {
      const tempPass = generateTempPassword();
      await updateFirebaseAuthPassword(req.userId, tempPass);
      await updateDoc(doc(db, "passwordResetRequests", req.id), {
        tempPasswordSet: true,
        mustChangePassword: true,
        status: "Pending",
        tempGeneratedAt: serverTimestamp(),
      });
      setGeneratedPasswords(prev => ({ ...prev, [req.id]: tempPass }));
      toast({ title: "Generated", description: `Temp password set for ${req.email}` });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(prev => ({ ...prev, [req.id]: null }));
    }
  };

  const handleMarkCompleted = async (req: any) => {
    if (!db) return;
    setActionLoading(prev => ({ ...prev, [req.id]: "completing" }));
    try {
      await updateDoc(doc(db, "passwordResetRequests", req.id), {
        status: "Completed",
        completedAt: serverTimestamp(),
        mustChangePassword: false,
      });
      toast({ title: "Completed", description: `Request for ${req.email} finalized.` });
    } catch (err: any) {
      toast({ title: "Failed", description: "Operation failed.", variant: "destructive" });
    } finally {
      setActionLoading(prev => ({ ...prev, [req.id]: null }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied" });
  };

  if (loading) return <div className="p-20 text-center text-primary font-bold animate-pulse">LOADING REQUESTS...</div>;

  const pending = requests.filter(r => r.status === "Pending");
  const completed = requests.filter(r => r.status === "Completed");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Recovery <span className="text-primary">Ledger</span></h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Identity Management Hub</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="h-8 px-4 font-bold border-orange-200 text-orange-600 bg-orange-50 uppercase tracking-wider">Pending: {pending.length}</Badge>
          <Badge variant="outline" className="h-8 px-4 font-bold border-green-200 text-green-600 bg-green-50 uppercase tracking-wider">Done: {completed.length}</Badge>
        </div>
      </div>

      <Card className="border-slate-100 shadow-sm rounded-[2rem] overflow-hidden bg-white">
        <CardHeader className="p-8 border-b bg-slate-50/30">
          <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-orange-500" /> Pending Requests
          </CardTitle>
          <CardDescription className="text-[10px]">Action items requiring manual verification and temporary password generation.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100">
                <TableHead className="text-[10px] font-bold uppercase tracking-widest px-8 h-12">User Email</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest px-8 h-12">Request Date</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest px-8 h-12">Temp Password</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest px-8 h-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-32 text-center text-xs font-bold text-slate-300 uppercase">No pending requests</TableCell></TableRow>
              ) : pending.map((req) => (
                <TableRow key={req.id} className="border-slate-100 h-20 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="px-8 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">{req.email}</span>
                      <span className="text-[9px] font-mono text-slate-400 mt-1 uppercase tracking-tighter">UID: {req.userId.slice(0, 10)}...</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-4 text-xs font-medium text-slate-500">
                    {req.requestTime?.toDate ? req.requestTime.toDate().toLocaleString() : 'Just now'}
                  </TableCell>
                  <TableCell className="px-8 py-4">
                    {generatedPasswords[req.id] ? (
                      <div className="flex items-center gap-2">
                        <code className="bg-slate-100 px-2 py-1 rounded text-[11px] font-mono font-bold text-primary">{generatedPasswords[req.id]}</code>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => copyToClipboard(generatedPasswords[req.id])}><Copy className="h-3.5 w-3.5" /></Button>
                      </div>
                    ) : req.tempPasswordSet ? (
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-100 font-bold text-[9px] uppercase h-5">Synced ✓</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-100 font-bold text-[9px] uppercase h-5">Not Set</Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-8 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-[10px] font-bold rounded-lg border-primary/20 text-primary hover:bg-primary/5"
                        onClick={() => handleGenerateTempPassword(req)}
                        disabled={!!actionLoading[req.id]}
                      >
                        {actionLoading[req.id] === 'generating' ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <KeyRound className="h-3 w-3 mr-1.5" />}
                        Generate
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-8 text-[10px] font-bold rounded-lg bg-green-500 hover:bg-green-600"
                        onClick={() => handleMarkCompleted(req)}
                        disabled={!!actionLoading[req.id] || !req.tempPasswordSet}
                      >
                         {actionLoading[req.id] === 'completing' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1.5" />}
                         Complete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-slate-100 shadow-sm rounded-[2rem] overflow-hidden bg-white opacity-60">
        <CardHeader className="p-8 border-b bg-slate-50/30">
          <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" /> Resolved Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableBody>
              {completed.map((req) => (
                <TableRow key={req.id} className="border-slate-100 h-16 grayscale">
                  <TableCell className="px-8 py-3 text-xs font-bold">{req.email}</TableCell>
                  <TableCell className="px-8 py-3 text-[10px] font-medium text-slate-400">Resolved: {req.completedAt?.toDate?.().toLocaleString() || 'Recently'}</TableCell>
                  <TableCell className="px-8 py-3 text-right">
                    <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-100 font-bold text-[9px] uppercase h-5">COMPLETED</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
