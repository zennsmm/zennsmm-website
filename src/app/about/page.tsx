import { Target, Users, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const BrandLogoIcon = ({ className = "h-12 w-12" }: { className?: string }) => (
  <div className={cn(
    "relative overflow-hidden bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center rounded-full transition-shadow duration-500",
    "shadow-[0_0_12px_rgba(168,85,247,0.9),0_0_24px_rgba(168,85,247,0.7),0_0_40px_rgba(168,85,247,0.5)]",
    "border border-white/20",
    className
  )}>
    <img 
      src="https://pdftourl.net/images/1781555709150-54f47441-c895-44f4-b71c-11b5ae082e44.jpg" 
      alt="Logo" 
      className="h-full w-full object-cover" 
    />
    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
  </div>
);

export default function AboutPage() {
  const values = [
    { title: 'Innovation', description: 'Using cutting-edge tech to deliver social media growth faster than ever.', icon: BrandLogoIcon },
    { title: 'Reliability', description: 'A platform built on trust, delivering results that actually stick.', icon: ShieldCheck },
    { title: 'Community', description: 'Empowering thousands of creators across the globe to find their voice.', icon: Users },
  ];

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-3xl mx-auto text-center mb-20">
        <h1 className="font-headline text-4xl sm:text-5xl font-bold mb-6">About <span className="text-primary font-black tracking-[-0.03em]">ZennSMM</span></h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Founded in 2023, ZennSMM was created to simplify the complex world of social media marketing. We provide a bridge between your content and the audience it deserves.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        {values.map((v) => (
          <div key={v.title} className="glass-card p-8 rounded-2xl text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <v.icon className="text-primary h-7 w-7" />
            </div>
            <h3 className="font-headline text-xl font-bold mb-4">{v.title}</h3>
            <p className="text-muted-foreground text-sm">{v.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-card/30 rounded-[2.5rem] p-8 md:p-16 border border-white/5 flex flex-col md:flex-row items-center gap-12">
        <div className="md:w-1/2">
          <h2 className="font-headline text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Our mission is to become the world's most trusted and efficient SMM panel. We focus on providing high-quality services at competitive prices, backed by an AI-driven support system that ensures customer satisfaction.
          </p>
          <div className="flex items-center gap-4">
            <div className="text-center p-4 border border-white/10 rounded-2xl flex-1">
              <p className="text-2xl font-bold">1M+</p>
              <p className="text-xs text-muted-foreground">Orders</p>
            </div>
            <div className="text-center p-4 border border-white/10 rounded-2xl flex-1">
              <p className="text-2xl font-bold">15k</p>
              <p className="text-xs text-muted-foreground">Users</p>
            </div>
          </div>
        </div>
        <div className="md:w-1/2">
          <div className="aspect-video bg-white/5 rounded-3xl overflow-hidden flex items-center justify-center relative group">
            <Target className="h-20 w-20 text-primary opacity-20 group-hover:scale-110 transition-transform" />
            <div className="absolute inset-0 border border-primary/20 rounded-3xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}