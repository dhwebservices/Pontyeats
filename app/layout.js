import './globals.css';
import { Inter, Fraunces } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap', axes: ['SOFT', 'opsz'] });

export const metadata = {
  title: 'Ponty Eats — Local food, delivered from the heart of Pontypridd',
  description: 'The local food ordering platform built for Pontypridd. Order from your favourite Taff Street takeaways and indie kitchens — delivered hot.',
};

const RootLayout = ({ children }) => (
  <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
    <body className="font-sans antialiased min-h-screen bg-background text-foreground">
      {children}
      <Toaster richColors position="top-right" />
    </body>
  </html>
);

export default RootLayout;
