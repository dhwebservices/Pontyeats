'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Check, ArrowLeft } from 'lucide-react';

const SignupPage = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { data: settings, error: settingsError } = await supabase
      .from('platform_settings')
      .select('restaurant_signups_enabled')
      .eq('id', 1)
      .maybeSingle();

    if (settingsError) {
      setLoading(false);
      toast.error('Unable to check signup availability right now. Please try again.');
      return;
    }

    if (settings && settings.restaurant_signups_enabled === false) {
      setLoading(false);
      toast.error('Restaurant applications are temporarily closed. Please try again later.');
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role: 'restaurant' },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    setLoading(false);

    if (session) {
      toast.success('Welcome to Ponty Eats!');
      router.push('/onboarding');
      router.refresh();
    } else {
      toast.success('Check your inbox to verify your email.');
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="relative hidden md:block">
        <img src="/pontypridd-bridge.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/85 via-primary/60 to-orange-700/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-between p-12 text-white">
          <Link href="/" className="inline-flex items-center gap-2 font-display text-2xl font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-primary font-sans text-base">P</span>
            Ponty Eats
          </Link>
          <div>
            <h2 className="font-display text-5xl font-semibold leading-[1.05] text-balance">
              Be one of the <span className="italic">first</span> on Ponty Eats.
            </h2>
            <ul className="mt-8 space-y-3 max-w-sm">
              {['Just 6% commission per order', 'Live order dashboard with sound', 'Stripe payouts handled for you', 'Cancel anytime, no contract'].map((t) => (
                <li key={t} className="flex items-center gap-3"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-primary"><Check className="h-3 w-3" /></span> {t}</li>
              ))}
            </ul>
          </div>
          <p className="text-xs opacity-80">© Ponty Eats · Made in Pontypridd</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-8 bg-background">
        <div className="w-full max-w-sm space-y-7">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back to home</Link>
          <div>
            <h1 className="font-display text-4xl font-semibold">List your restaurant</h1>
            <p className="text-sm text-muted-foreground mt-2">Free to start. No card required. 5-minute setup.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Owner / Manager name" className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@restaurant.co.uk" className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="h-11" />
            </div>
            <Button type="submit" className="w-full h-11 rounded-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
            </Button>
          </form>
          <p className="text-sm text-center text-muted-foreground">
            Already have an account? <Link href="/login" className="font-semibold text-foreground hover:text-primary">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
