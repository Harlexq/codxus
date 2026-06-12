import './globals.css';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { AppProvider } from '@/providers';
import { TooltipProvider } from '@/components/ui/tooltip';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn('dark font-sans', 'font-sans', inter.variable)}>
      <body>
        <AppProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </AppProvider>
      </body>
    </html>
  );
}
