
"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mail, MessageSquare, MapPin, Clock, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ContactPage() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast({
        title: "Message Sent",
        description: "We'll get back to you within 24 hours.",
      });
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="font-headline text-4xl font-bold mb-4">Contact <span className="text-primary">Support</span></h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Have questions? Our support team is available 24/7 to help you with your orders and account.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-card/50 border-white/10">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="bg-primary/10 p-2.5 rounded-lg shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold mb-1">Email Us</p>
                  <p className="text-xs text-muted-foreground">support@zennsmm.com</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-white/10">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="bg-accent/10 p-2.5 rounded-lg shrink-0">
                  <MessageSquare className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-bold mb-1">Live Chat</p>
                  <p className="text-xs text-muted-foreground">Available in your dashboard</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-white/10">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="bg-primary/10 p-2.5 rounded-lg shrink-0">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold mb-1">Working Hours</p>
                  <p className="text-xs text-muted-foreground">Mon - Sun: 09:00 - 21:00 IST</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card className="bg-card/50 border-white/10 overflow-hidden">
                <CardContent className="p-8 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider">Full Name</Label>
                      <Input placeholder="John Doe" className="bg-background border-white/10" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider">Email Address</Label>
                      <Input type="email" placeholder="john@example.com" className="bg-background border-white/10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider">Subject</Label>
                    <Input placeholder="Order help, service question, etc." className="bg-background border-white/10" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider">Message</Label>
                    <Textarea placeholder="How can we help you today?" className="bg-background border-white/10 min-h-[150px]" required />
                  </div>
                  <Button type="submit" className="w-full h-12 text-base font-bold" disabled={submitting}>
                    {submitting ? "Sending..." : <span className="flex items-center gap-2">Send Message <Send className="h-4 w-4" /></span>}
                  </Button>
                </CardContent>
              </Card>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
