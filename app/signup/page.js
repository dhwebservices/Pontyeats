'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Check } from 'lucide-react';

const SignupPage = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
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
    // If email confirmation disabled, user is signed in already
    const { data: { session } } = await supabase.auth.getSession();
    setLoading(false);
    if (session) {
      toast.success('Account created!');
      router.push('/onboarding');
      router.refresh();
    } else {
      toast.success('Check your inbox to verify your email.');
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex relative bg-gradient-to-br from-primary via-orange-500 to-amber-500 p-12 text-primary-foreground">
        <div aria-hidden className="absolute inset-0 grain opacity-30" />
        <div className="relative flex flex-col justify-between w-full">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-primary">P</span>
            Ponty Eats
          </Link>
          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight">Get your restaurant on Ponty Eats in under 5 minutes.</h2>
            <ul className="space-y-3 text-white/90">
              {['Just 6% commission per order','Live order dashboard','Stripe payouts handled for you','Cancel anytime, no contract'].map((t) => (
                <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4" /> {t}</li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-white/70">© Ponty Eats</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="md:hidden">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">P</span>
              Ponty Eats
            </Link>
          </div>
          <div>
            <h1 className="text-2xl font-bold">List your restaurant</h1>
            <p className="text-sm text-muted-foreground mt-1">Free to start. No card required.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Owner / Manager name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@restaurant.co.uk" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
            </Button>
          </form>
          <p className="text-sm text-center text-muted-foreground">
            Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
