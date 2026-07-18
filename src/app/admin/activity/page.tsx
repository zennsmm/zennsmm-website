"use client";

import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Download, Clock, Terminal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { exportToCSV } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminActivityPage() {
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const [search, setSearch] = useState('');
  
  const logsQuery = useMemoFirebase(() => 
    (db && user && !authLoading) ? query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(100)) : null,
  [db, user, authLoading]);

  const { data: logs = [], loading: dataLoading } = useCollection(logsQuery);

  const filteredLogs = useMemo(() => {
    if (!search) return logs;
    const s = search.toLowerCase();
    return logs.filter((l: any) => l.action?.toLowerCase().includes(s) || l.userId?.toLowerCase().includes(s));
  }, [logs, search]);

  const loading = authLoading || dataLoading;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black mb-1">Audit <span className="text-primary">Trail</span></h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Complete System Transaction History</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => exportToCSV(filteredLogs, 'audit_trail.csv')}
          className="rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest border-slate-200"
          disabled={loading || filteredLogs.length === 0}
        >
          <Download className="h-4 w-4 mr-2" /> Export Audit
        </Button>
      </div>

      <Card className="border-slate-100 shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-3">
            <Terminal className="h-5 w-5 text-primary" /> Event Stream
          </CardTitle>
          <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <Input 
              placeholder="Search actions or users..." 
              className="pl-11 h-12 bg-slate-50 border-transparent rounded-2xl font-bold text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/30">
                  <th className="px-8 py-4">Action Event</th>
                  <th className="px-8 py-4">Origin Identity</th>
                  <th className="px-8 py-4">Terminal / IP</th>
                  <th className="px-8 py-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [1,2,3].map(i => <tr key={i}><td colSpan={4} className="p-8"><Skeleton className="h-10 w-full rounded-xl" /></td></tr>)
                ) : filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors h-20">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg"><Clock className="h-3.5 w-3.5 text-slate-400" /></div>
                        <span className="text-xs font-black text-slate-900 leading-tight">{log.action}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                       <span className="text-[10px] font-mono font-bold text-primary uppercase">{log.userId?.slice(0, 15)}...</span>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.ip || 'INTERNAL'}</span>
                    </td>
                    <td className="px-8 py-4 text-right text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                      {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && !loading && (
                  <tr><td colSpan={4} className="p-24 text-center text-xs font-black text-slate-200 uppercase tracking-widest">No Log Entries Recorded</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}