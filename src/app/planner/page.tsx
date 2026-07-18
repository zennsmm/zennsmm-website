"use client";

import { useState, useMemo } from 'react';
import { socialBoostPlannerRecommendation, type SocialBoostPlannerRecommendationOutput } from '@/ai/flows/social-boost-planner-recommendation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, BrainCircuit, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';

export default function PlannerPage() {
  const [goals, setGoals] = useState('');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<SocialBoostPlannerRecommendationOutput | null>(null);
  
  const db = useFirestore();
  const { data: services } = useCollection(db ? query(collection(db, 'services')) : null);

  const servicesCatalog = useMemo(() => JSON.stringify(services || []), [services]);

  const handlePlan = async () => {
    if (!goals || !budget) return;
    setLoading(true);
    try {
      const result = await socialBoostPlannerRecommendation({
        goals,
        budget: parseFloat(budget),
        servicesCatalog
      });
      setRecommendation(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex flex-col items-center text-center mb-12">
        <div className="bg-primary/10 p-3 rounded-2xl mb-6">
          <BrainCircuit className="h-10 w-10 text-primary" />
        </div>
        <h1 className="font-headline text-3xl sm:text-4xl font-bold mb-4">Social <span className="text-primary">Boost Planner</span></h1>
        <p className="text-muted-foreground max-w-xl">
          Use our AI to plan your perfect social media growth strategy based on your goals and budget.
        </p>
      </div>

      {!recommendation ? (
        <Card className="bg-card/50 border-white/10 shadow-2xl">
          <CardHeader>
            <CardTitle>Define Your Goals</CardTitle>
            <CardDescription>Tell us what you want to achieve and your investment limit in USD.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> What are your growth goals?
              </label>
              <Textarea 
                placeholder="Example: I want to gain 5000 Instagram followers and increase views on my last 10 posts."
                className="min-h-[120px] bg-background border-white/10 focus:ring-primary"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" /> What is your budget (USD)?
              </label>
              <Input 
                type="number"
                placeholder="Enter budget in $"
                className="h-12 bg-background border-white/10 focus:ring-primary"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full h-14 text-lg font-bold" 
              onClick={handlePlan}
              disabled={loading || !goals || !budget}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 animate-spin" /> Calculating Strategy...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Generate My Plan <ArrowRight className="h-5 w-5" />
                </span>
              )}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> AI Strategy Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed">{recommendation.summary}</p>
            </CardContent>
          </Card>

          <h2 className="font-headline text-2xl font-bold mt-12 mb-6">Recommended Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendation.recommendations.map((rec, i) => (
              <Card key={i} className="bg-card/50 border-white/10 hover:border-primary/30 transition-all">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="border-primary/30 text-primary">{rec.category}</Badge>
                    <span className="font-bold text-lg">${rec.price}</span>
                  </div>
                  <CardTitle className="text-lg leading-tight">{rec.serviceName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{rec.justification}</p>
                  <div className="bg-accent/5 p-3 rounded-lg border border-accent/10">
                    <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1">Estimated Impact</p>
                    <p className="text-sm">{rec.estimatedImpact}</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href="/services" className="w-full">
                    <Button variant="outline" className="w-full border-white/10 hover:bg-primary hover:text-white transition-all">
                      View Service Details
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="flex justify-center pt-8">
            <Button variant="ghost" onClick={() => setRecommendation(null)}>
              Start Over with New Goals
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
