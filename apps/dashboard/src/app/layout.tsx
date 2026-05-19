import type { Metadata } from 'next';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Providers } from '@/components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'SimForge',
    template: '%s | SimForge',
  },
  description: 'Distributed behavioral simulation engine for real-world system stress testing.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <Providers>
          <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
