'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, ArrowRight, Store } from 'lucide-react';

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const OnboardingForm = ({ userId }) => {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', cuisine_type: '', description: '',
    phone: '', address_line: '', postal_code: '',
    prep_time_minutes: 25, min_order_value: 0, delivery_radius_miles: 3,
  });

  const handle = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const slug = `${slugify(form.name)}-${Math.random().toString(36).slice(2,6)}`;
    const { data, error } = await supabase.from('restaurants').insert({
      owner_id: userId,
      name: form.name,
      slug,
      cuisine_type: form.cuisine_type,
      description: form.description,
      phone: form.phone,
      address_line: form.address_line,
      postal_code: form.postal_code,
      prep_time_minutes: Number(form.prep_time_minutes) || 25,
      min_order_value: Number(form.min_order_value) || 0,
      delivery_radius_miles: Number(form.delivery_radius_miles) || 3,
    }).select().single();
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Restaurant created!');
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">P</span>
            Ponty Eats
          </Link>
          <div className="text-sm text-muted-foreground">Step 1 of 1 · Restaurant details</div>
        </div>
      </header>

      <div className="container max-w-2xl py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Tell us about your restaurant</h1>
            <p className="text-sm text-muted-foreground">You can edit any of this later in settings.</p>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-2xl border bg-card p-6 md:p-8 space-y-6 shadow-sm">
          <div className="space-y-1.5">
            <Label htmlFor="name">Restaurant name *</Label>
            <Input id="name" required value={form.name} onChange={handle('name')} placeholder="e.g. Taff Street Tandoori" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cuisine">Cuisine</Label>
              <Input id="cuisine" value={form.cuisine_type} onChange={handle('cuisine_type')} placeholder="Indian, Pizza, Welsh, etc." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={handle('phone')} placeholder="01443 ..." />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Short description</Label>
            <Textarea id="description" rows={3} value={form.description} onChange={handle('description')} placeholder="What makes you special?" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="address">Street address</Label>
              <Input id="address" value={form.address_line} onChange={handle('address_line')} placeholder="e.g. 12 Taff Street" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="postcode">Postcode</Label>
              <Input id="postcode" value={form.postal_code} onChange={handle('postal_code')} placeholder="CF37 ..." />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prep">Prep time (min)</Label>
              <Input id="prep" type="number" value={form.prep_time_minutes} onChange={handle('prep_time_minutes')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="min">Min order (£)</Label>
              <Input id="min" type="number" step="0.01" value={form.min_order_value} onChange={handle('min_order_value')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="radius">Delivery radius (mi)</Label>
              <Input id="radius" type="number" step="0.5" value={form.delivery_radius_miles} onChange={handle('delivery_radius_miles')} />
            </div>
          </div>
          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Open my dashboard <ArrowRight className="ml-1 h-4 w-4" /></>}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingForm;
