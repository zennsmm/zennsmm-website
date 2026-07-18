"use client";

import { useState, useMemo } from "react";
import { useFirestore, useUser, useMemoFirebase, useCollection } from "@/firebase";
import { collection, query, orderBy, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Loader2, Copy, Trash2, KeyRound, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { logActivity } from "@/lib/activity-logger";
import { syncUserPassword } from "@/ai/flows/password-reset-flow";

export default function AdminPasswordResetsPage() {
  const db = useFirestore();
  const { user: adminUser } = useUser();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [generatedPasswords, setGeneratedPasswords] = useState<Record<string, string>>({});

  const resetsQuery = useMemoFirebase(() => {
    if (!db || !adminUser) return null;
    return query(collection(db, "password_reset_requests"), orderBy("createdAt", "desc"));
  }, [db, adminUser]);

  const { data: requests = [], loading } = useCollection(resetsQuery);

  const filteredRequests = useMemo(() => {
    if (!search) return requests;
    const s = search.toLowerCase();
    return requests.filter(
      (r) => r.email?.toLowerCase().includes(s) || r.userId?.toLowerCase().includes(s)
    );
  }, [requests, search]);

  const handleGenerate = async (request: any) => {
    if (!db || !adminUser) return;
    setProcessing(request.id);
    try {
      console.log("[Admin] Initiating Auth Sync for:", request.email);
      const syncResult = await syncUserPassword({
        email: request.email,
        requestId: request.id
      });

      if (!syncResult.success) {
        throw new Error(syncResult.message || "Failed to sync password with Firebase Auth");
      }

      const tempPass = syncResult.password!;
      setGeneratedPasswords((prev) => ({ ...prev, [request.id]: tempPass }));
      
      await logActivity(db, `Generated temp password for ${request.email} - Firebase Auth synced`, adminUser.uid);
      toast({ title: "Authorized & Synced", description: `Temporary access granted for ${request.email}` });
    } catch (err: any) {
      console.error("[Password Sync Error]:", err);
      toast({ title: "Sync Failed", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!db || !confirm(`Delete request for ${email}?`)) return;
    setProcessing(id);
    try {
      await deleteDoc(doc(db, "password_reset_requests", id));
      toast({ title: "Deleted", description: "Request removed from ledger." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Credential copied to clipboard." });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black mb-1">Pass <span className="text-primary">Resets</span></h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Identity Recovery Ledger</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <Input
            placeholder="Search email or UID..."
            className="pl-9 h-10 md:h-11 text-xs rounded-xl bg-white border-slate-100"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-slate-100 shadow-sm rounded-2xl md:rounded-[2rem] overflow-hidden bg-white">
        <CardHeader className="p-8 border-b bg-slate-50/30">
          <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" /> Active Requests
          </CardTitle>
          <CardDescription className="text-[10px] font-medium">Verify and authorize temporary credentials.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-100">
                  <TableHead className="text-[10px] font-bold uppercase px-8 py-4">Client Identity</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase px-8 py-4">Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase px-8 py-4">Access Key</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase px-8 py-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-48 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary opacity-20" />
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.length > 0 ? (
                  filteredRequests.map((req) => (
                    <TableRow key={req.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors h-24">
                      <TableCell className="px-8">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold leading-tight mb-1">{req.email}</span>
                          <span className="text-[9px] font-mono uppercase tracking-tighter text-muted-foreground">
                            UID: {req.userId?.slice(0, 10)}...
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] uppercase h-5 font-bold tracking-widest px-2",
                            req.status === "pending"
                              ? "bg-orange-50 text-orange-600 border-orange-100"
                              : "bg-green-50 text-green-600 border-green-100"
                          )}
                        >
                          {req.status || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-8">
                        {(req.temporaryPassword || generatedPasswords[req.id]) ? (
                          <div className="flex items-center gap-2">
                            <code className="bg-slate-100 px-2 py-1 rounded text-xs font-bold font-mono text-primary border border-primary/10">
                              {generatedPasswords[req.id] || req.temporaryPassword}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-primary/5 rounded-lg"
                              onClick={() => copyToClipboard(generatedPasswords[req.id] || req.temporaryPassword)}
                            >
                              <Copy className="h-3.5 w-3.5 text-slate-400" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">
                            Awaiting Auth
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-8 text-right">
                        <div className="flex justify-end gap-2">
                          {req.status === "pending" ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-[10px] font-bold rounded-lg border-primary/20 text-primary hover:bg-primary/5"
                                onClick={() => handleGenerate(req)}
                                disabled={processing === req.id}
                              >
                                {processing === req.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                                ) : (
                                  <ShieldCheck className="h-3 w-3 mr-1.5" />
                                )}
                                Authorize
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-red-400 hover:bg-red-50 rounded-xl"
                                onClick={() => handleDelete(req.id, req.email)}
                                disabled={processing === req.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-slate-300 hover:text-red-500 rounded-xl"
                              onClick={() => handleDelete(req.id, req.email)}
                              disabled={processing === req.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-48 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">
                      No active requests
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}