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
import { Loader2, ArrowRight } from 'lucide-react';

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
    const { error } = await supabase.from('restaurants').insert({
      owner_id: userId, name: form.name, slug,
      cuisine_type: form.cuisine_type, description: form.description,
      phone: form.phone, address_line: form.address_line, postal_code: form.postal_code,
      prep_time_minutes: Number(form.prep_time_minutes) || 25,
      min_order_value: Number(form.min_order_value) || 0,
      delivery_radius_miles: Number(form.delivery_radius_miles) || 3,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Restaurant created!');
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-sans text-sm">P</span>
            Ponty Eats
          </Link>
          <div className="text-xs text-muted-foreground">Step 1 of 1</div>
        </div>
      </header>

      <div className="container max-w-2xl py-12 md:py-20">
        <h1 className="font-display text-4xl md:text-6xl font-semibold leading-[1] text-balance">Tell us about your <span className="italic text-primary">restaurant</span>.</h1>
        <p className="text-muted-foreground mt-4 text-lg">You can edit any of this later in settings.</p>

        <form onSubmit={submit} className="mt-12 space-y-8">
          <Section title="The basics">
            <Field label="Restaurant name *">
              <Input required value={form.name} onChange={handle('name')} placeholder="e.g. Taff Street Tandoori" className="h-11" />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Cuisine">
                <Input value={form.cuisine_type} onChange={handle('cuisine_type')} placeholder="Indian, Pizza, Welsh..." className="h-11" />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={handle('phone')} placeholder="01443 ..." className="h-11" />
              </Field>
            </div>
            <Field label="Short description">
              <Textarea rows={3} value={form.description} onChange={handle('description')} placeholder="What makes you special?" />
            </Field>
          </Section>

          <Section title="Where you are">
            <Field label="Street address">
              <Input value={form.address_line} onChange={handle('address_line')} placeholder="e.g. 12 Taff Street" className="h-11" />
            </Field>
            <Field label="Postcode">
              <Input value={form.postal_code} onChange={handle('postal_code')} placeholder="CF37 ..." className="h-11" />
            </Field>
          </Section>

          <Section title="Operations">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Field label="Prep time (min)">
                <Input type="number" value={form.prep_time_minutes} onChange={handle('prep_time_minutes')} className="h-11" />
              </Field>
              <Field label="Min order (£)">
                <Input type="number" step="0.01" value={form.min_order_value} onChange={handle('min_order_value')} className="h-11" />
              </Field>
              <Field label="Delivery radius (mi)">
                <Input type="number" step="0.5" value={form.delivery_radius_miles} onChange={handle('delivery_radius_miles')} className="h-11" />
              </Field>
            </div>
          </Section>

          <Button type="submit" size="lg" className="w-full md:w-auto h-12 rounded-full px-8" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Open my dashboard <ArrowRight className="ml-2 h-4 w-4" /></>}
          </Button>
        </form>
      </div>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="border-t pt-8">
    <h2 className="font-display text-2xl font-semibold mb-6">{title}</h2>
    <div className="space-y-5">{children}</div>
  </div>
);
const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium">{label}</Label>
    {children}
  </div>
);

export default OnboardingForm;
