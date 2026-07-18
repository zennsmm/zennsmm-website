"use client";

import { useCollection, useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, serverTimestamp, arrayUnion, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Clock, User, Send, Loader2, CheckCircle2, AlertCircle, Filter, Star } from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminTicketsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const ticketsQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'tickets'), orderBy('createdAt', 'desc')) : null,
  [db]);

  const { data: tickets = [], loading: ticketsLoading } = useCollection(ticketsQuery);

  const filteredTickets = useMemo(() => {
    if (statusFilter === 'all') return tickets;
    return tickets.filter((t: any) => t.status === statusFilter);
  }, [tickets, statusFilter]);

  const selectedTicket = useMemo(() => 
    tickets.find((t: any) => t.id === selectedTicketId), 
  [tickets, selectedTicketId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket]);

  const handleSendReply = async () => {
    if (!selectedTicketId || !replyText.trim() || !db || !user) return;
    setSending(true);
    try {
      const ticketRef = doc(db, 'tickets', selectedTicketId);
      await updateDoc(ticketRef, {
        messages: arrayUnion({
          senderId: user.uid,
          text: replyText,
          timestamp: new Date().toISOString()
        }),
        status: 'pending',
        updatedAt: serverTimestamp()
      });
      setReplyText('');
      toast({ title: "Reply Sent" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db!, 'tickets', id), { status: newStatus, updatedAt: serverTimestamp() });
      toast({ title: `Ticket ${newStatus.toUpperCase()}` });
    } catch (err: any) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const stats = useMemo(() => ({
    open: tickets.filter((t: any) => t.status === 'open').length,
    pending: tickets.filter((t: any) => t.status === 'pending').length,
    closed: tickets.filter((t: any) => t.status === 'closed').length,
  }), [tickets]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black mb-1">Support <span className="text-primary">Terminal</span></h1>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">High-Fidelity Client Assistance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Awaiting Action', val: stats.open, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Pending Response', val: stats.pending, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Resolved Cases', val: stats.closed, color: 'text-slate-400', bg: 'bg-slate-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</span>
            <span className={cn("text-xl font-black", s.color)}>{s.val}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-320px)]">
        <Card className="lg:col-span-4 border-slate-100 shadow-sm rounded-[2.5rem] overflow-hidden flex flex-col bg-white">
          <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest">Inbox</CardTitle>
            <select 
              className="text-[9px] font-black uppercase bg-slate-50 border-0 rounded-lg h-8 px-2 outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
            </select>
          </CardHeader>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {ticketsLoading ? (
              [1,2,3].map(i => <div key={i} className="p-8"><Skeleton className="h-12 w-full rounded-xl" /></div>)
            ) : filteredTickets.map((t: any) => (
              <button 
                key={t.id} 
                onClick={() => setSelectedTicketId(t.id)}
                className={cn(
                  "w-full text-left p-6 hover:bg-slate-50 transition-all border-l-4 border-transparent relative",
                  selectedTicketId === t.id && "bg-primary/5 border-primary"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[9px] font-mono font-bold text-slate-300">#T-{t.id.slice(-6).toUpperCase()}</span>
                  <Badge variant="outline" className={cn(
                    "text-[8px] font-black uppercase h-4 px-1.5 border-0",
                    t.status === 'open' ? "bg-green-50 text-green-600" : (t.status === 'closed' ? "bg-slate-100 text-slate-400" : "bg-blue-50 text-blue-600")
                  )}>{t.status}</Badge>
                </div>
                <h4 className="text-[13px] font-black truncate text-slate-900 mb-1">{t.subject}</h4>
                <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  <User className="h-3 w-3" /> {t.userId?.slice(0, 8)}...
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-8 border-slate-100 shadow-sm rounded-[2.5rem] overflow-hidden flex flex-col bg-white relative">
          {selectedTicket ? (
            <>
              <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-primary/10 rounded-2xl shadow-sm border border-primary/5">
                      <MessageSquare className="h-6 w-6 text-primary" />
                   </div>
                   <div>
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">{selectedTicket.subject}</h3>
                      <p className="text-[9px] font-mono font-bold text-slate-300 uppercase mt-0.5">UID: {selectedTicket.userId}</p>
                   </div>
                </div>
                <div className="flex gap-2">
                   <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-slate-200" onClick={() => handleUpdateStatus(selectedTicket.id, 'closed')}>Resolve Case</Button>
                </div>
              </CardHeader>
              
              <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/20">
                {selectedTicket.messages?.map((msg: any, i: number) => (
                  <div key={i} className={cn(
                    "flex flex-col max-w-[80%]",
                    msg.senderId === user?.uid ? "ml-auto items-end" : "mr-auto items-start"
                  )}>
                    <div className={cn(
                      "p-5 rounded-[1.5rem] text-sm font-bold leading-relaxed shadow-sm border",
                      msg.senderId === user?.uid ? "bg-primary text-white border-primary/10" : "bg-white border-slate-100 text-slate-700"
                    )}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] font-black text-slate-300 mt-2 uppercase px-1 tracking-widest">
                      {msg.senderId === user?.uid ? 'Admin Response' : 'Client Inq'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="p-8 border-t border-slate-100 bg-white">
                <div className="relative">
                  <Textarea 
                    placeholder="Technical directive to user..."
                    className="min-h-[120px] rounded-[1.5rem] bg-slate-50 border-transparent focus:bg-white text-sm font-bold resize-none pb-14"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <Button 
                    className="absolute bottom-4 right-4 h-11 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20"
                    onClick={handleSendReply}
                    disabled={sending || !replyText.trim()}
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Deploy Reply
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30">
               <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8">
                 <MessageSquare className="h-10 w-10 text-slate-200" />
               </div>
               <h3 className="text-xl font-black text-slate-400 mb-2 uppercase tracking-tight">Select a Ticket</h3>
               <p className="text-[10px] font-black text-slate-300 max-w-[280px] uppercase tracking-[0.2em] leading-relaxed">Identity verification and technical support console awaiting directive.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
