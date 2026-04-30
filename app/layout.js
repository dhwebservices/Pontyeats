import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'Ponty Eats — Local food delivery in Pontypridd',
  description: 'The local food ordering platform for Pontypridd. Order from your favourite local restaurants — delivered fast.',
};

const RootLayout = ({ children }) => (
  <html lang="en" className={inter.variable}>
    <body className="font-sans antialiased min-h-screen bg-background text-foreground">
      {children}
      <Toaster richColors position="top-right" />
    </body>
  </html>
);

export default RootLayout;
