
"use client";

import { useState } from 'react';
import { runAuthDiagnostics } from '@/ai/flows/password-reset-flow';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Search, Loader2, Database, Key, Mail } from 'lucide-react';

export default function DebugAuthPage() {
  const [email, setEmail] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleRunDiagnostics = async () => {
    setLoading(true);
    try {
      const data = await runAuthDiagnostics(email);
      setResults(data);
    } catch (err) {
      setResults({ error: "Failed to run action" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-red-100 rounded-2xl">
          <ShieldAlert className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Auth <span className="text-red-600">Diagnostics</span></h1>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-60">System Troubleshooting</p>
        </div>
      </div>

      <Card className="border-slate-100 shadow-sm rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" /> Active Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Admin Project ID</p>
              <p className="text-sm font-mono font-bold">{results?.projectId || 'Not Loaded'}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Service Account</p>
              <p className="text-sm font-mono font-bold truncate">{results?.serviceAccountEmail || 'Not Loaded'}</p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Test Email Lookup</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input 
                    placeholder="Enter user email..." 
                    className="pl-10 h-12 rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleRunDiagnostics} 
                  disabled={loading}
                  className="h-12 px-6 rounded-xl font-bold"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Probe Auth"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {results && results.lookup && (
        <Card className="border-slate-100 shadow-sm rounded-[2rem] overflow-hidden animate-in fade-in slide-in-from-top-4">
          <CardHeader className="p-8 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" /> Lookup Results
            </CardTitle>
            <Badge variant={results.lookup.success ? "default" : "destructive"} className="uppercase text-[10px] font-bold px-3">
              {results.lookup.success ? "USER FOUND" : "NOT FOUND"}
            </Badge>
          </CardHeader>
          <CardContent className="p-8">
            <pre className="bg-slate-900 text-green-400 p-6 rounded-2xl overflow-auto text-xs font-mono">
              {JSON.stringify(results.lookup, null, 2)}
            </pre>
            {!results.lookup.success && (
              <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-red-900">Why did this fail?</p>
                  <p className="text-xs text-red-700 leading-relaxed">
                    If this user can login but <span className="font-mono bg-red-100 px-1">getUserByEmail</span> fails with <span className="font-bold">auth/user-not-found</span>, 
                    the Admin SDK is definitively connected to the wrong Firebase Project. 
                    Check if your service account belongs to <span className="font-mono font-bold">{results.projectId}</span>.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
