import type {Metadata} from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });

export const metadata: Metadata = {
  title: 'ZennSMM | Premium Social Media Growth',
  description: 'Boost your social presence with ZennSMM. High-quality followers, likes, and views delivered instantly.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="antialiased flex flex-col min-h-screen font-sans">
        <FirebaseClientProvider>
          <Navbar />
          <main className="flex-grow bg-slate-50/30">
            {children}
          </main>
          <Footer />
          <Toaster />
          <Link 
            href="/admin/login" 
            className="fixed bottom-4 left-4 z-[9999] text-[9px] text-slate-300 opacity-20 hover:opacity-100 transition-opacity no-underline"
          >
            admin
          </Link>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
