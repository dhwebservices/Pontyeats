'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const AdminSettingsClient = ({ initial }) => {
  const supabase = createClient();
  const [s, setS] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setS({ ...s, [k]: v });

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('platform_settings').update({
      restaurant_signups_enabled: !!s.restaurant_signups_enabled,
      customer_signups_enabled: !!s.customer_signups_enabled,
      default_commission_pct: Number(s.default_commission_pct),
      updated_at: new Date().toISOString(),
    }).eq('id', 1);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Platform settings saved');
  };

  return (
    <div className="p-6 md:p-12 max-w-3xl">
      <h1 className="font-display text-4xl md:text-5xl font-semibold">Platform settings</h1>
      <p className="text-muted-foreground mt-2">Global toggles and rates.</p>
      <div className="mt-8 space-y-6">
        <Row label="Restaurant signups" desc="Allow new restaurants to create accounts" checked={s.restaurant_signups_enabled} onChange={(v) => set('restaurant_signups_enabled', v)} />
        <Row label="Customer signups" desc="Allow customers to register accounts (guest checkout still works either way)" checked={s.customer_signups_enabled} onChange={(v) => set('customer_signups_enabled', v)} />
        <div className="rounded-2xl border bg-card p-5">
          <Label className="text-sm font-medium">Default commission %</Label>
          <p className="text-xs text-muted-foreground mt-1">Applied to new orders. Existing orders keep their original rate.</p>
          <Input type="number" step="0.5" className="mt-3 max-w-xs" value={s.default_commission_pct ?? 6} onChange={(e) => set('default_commission_pct', e.target.value)} />
        </div>
        <Button onClick={save} disabled={saving} className="rounded-full">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}</Button>
      </div>
    </div>
  );
};

const Row = ({ label, desc, checked, onChange }) => (
  <div className="flex items-start justify-between rounded-2xl border bg-card p-5">
    <div>
      <div className="font-medium">{label}</div>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
    </div>
    <Switch checked={!!checked} onCheckedChange={onChange} />
  </div>
);

export default AdminSettingsClient;
