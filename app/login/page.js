'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';

const LoginPage = () => {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Welcome back!');
    router.push(next);
    router.refresh();
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="relative hidden md:block">
        <img src="/pontypridd-bridge.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/85 via-black/55 to-black/30" />
        <div className="relative z-10 h-full flex flex-col justify-between p-12 text-white">
          <Link href="/" className="inline-flex items-center gap-2 font-display text-2xl font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-sans text-base">P</span>
            Ponty Eats
          </Link>
          <div>
            <h2 className="font-display text-5xl font-semibold leading-[1.05] text-balance">
              Your <span className="italic text-primary">kitchen</span><br />never stops.
            </h2>
            <p className="mt-4 max-w-sm opacity-85">Sign in to manage live orders, your menu, and your earnings — all from one screen.</p>
          </div>
          <p className="text-xs opacity-70">© Ponty Eats · Made in Pontypridd</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-8 bg-background">
        <div className="w-full max-w-sm space-y-7">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back to home</Link>
          <div>
            <h1 className="font-display text-4xl font-semibold">Sign in</h1>
            <p className="text-sm text-muted-foreground mt-2">Welcome back. Let's get you to your dashboard.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@restaurant.co.uk" className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
            </div>
            <Button type="submit" className="w-full h-11 rounded-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
            </Button>
          </form>
          <p className="text-sm text-center text-muted-foreground">
            New to Ponty Eats? <Link href="/signup" className="font-semibold text-foreground hover:text-primary">List your restaurant</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
