'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, ImagePlus } from 'lucide-react';

const SettingsClient = ({ restaurant: initial }) => {
  const supabase = createClient();
  const [r, setR] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setR({ ...r, [k]: v });

  const upload = async (file, kind) => {
    const ext = file.name.split('.').pop();
    const path = `${r.id}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('restaurant-assets').upload(path, file, { cacheControl: '3600', upsert: true });
    if (error) { toast.error(error.message); return null; }
    const { data } = supabase.storage.from('restaurant-assets').getPublicUrl(path);
    return data.publicUrl;
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('restaurants').update({
      name: r.name, description: r.description, cuisine_type: r.cuisine_type,
      phone: r.phone, address_line: r.address_line, postal_code: r.postal_code,
      logo_url: r.logo_url, banner_url: r.banner_url,
      is_open: r.is_open, delivery_enabled: r.delivery_enabled, collection_enabled: r.collection_enabled,
      delivery_radius_miles: Number(r.delivery_radius_miles),
      min_order_value: Number(r.min_order_value),
      prep_time_minutes: Number(r.prep_time_minutes),
      updated_at: new Date().toISOString(),
    }).eq('id', r.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Settings saved');
  };

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your storefront and operations.</p>
      </div>

      <Card title="Storefront">
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4 bg-gradient-to-br from-primary/5 to-transparent">
            <div>
              <div className="font-medium">Accepting orders</div>
              <p className="text-xs text-muted-foreground">When off, customers can browse but not order.</p>
            </div>
            <Switch checked={r.is_open} onCheckedChange={(v) => set('is_open', v)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Img label="Logo" url={r.logo_url} onUpload={async (f) => { const u = await upload(f, 'logo'); if (u) set('logo_url', u); }} />
            <Img label="Banner" url={r.banner_url} onUpload={async (f) => { const u = await upload(f, 'banner'); if (u) set('banner_url', u); }} wide />
          </div>
          <Field label="Restaurant name"><Input value={r.name || ''} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="Cuisine"><Input value={r.cuisine_type || ''} onChange={(e) => set('cuisine_type', e.target.value)} /></Field>
          <Field label="Description"><Textarea rows={3} value={r.description || ''} onChange={(e) => set('description', e.target.value)} /></Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Phone"><Input value={r.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field>
            <Field label="Postcode"><Input value={r.postal_code || ''} onChange={(e) => set('postal_code', e.target.value)} /></Field>
          </div>
          <Field label="Street address"><Input value={r.address_line || ''} onChange={(e) => set('address_line', e.target.value)} /></Field>
        </div>
      </Card>

      <Card title="Operations">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Prep time (min)"><Input type="number" value={r.prep_time_minutes || 25} onChange={(e) => set('prep_time_minutes', e.target.value)} /></Field>
          <Field label="Min order (£)"><Input type="number" step="0.01" value={r.min_order_value || 0} onChange={(e) => set('min_order_value', e.target.value)} /></Field>
          <Field label="Delivery radius (mi)"><Input type="number" step="0.5" value={r.delivery_radius_miles || 3} onChange={(e) => set('delivery_radius_miles', e.target.value)} /></Field>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <ToggleRow label="Delivery" desc="Customers can order for delivery" checked={r.delivery_enabled} onChange={(v) => set('delivery_enabled', v)} />
          <ToggleRow label="Collection" desc="Customers can pick up orders" checked={r.collection_enabled} onChange={(v) => set('collection_enabled', v)} />
        </div>
      </Card>

      <Card title="Earnings">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Commission %"><Input value={r.commission_pct} disabled /></Field>
          <Field label="Payout method"><Input value="Manual (Stripe Connect coming soon)" disabled /></Field>
          <Field label="City"><Input value={r.city} disabled /></Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="min-w-32">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}</Button>
      </div>
    </div>
  );
};

const Card = ({ title, children }) => (
  <div className="rounded-2xl border bg-card">
    <div className="px-6 py-4 border-b"><h2 className="font-semibold">{title}</h2></div>
    <div className="p-6">{children}</div>
  </div>
);
const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    {children}
  </div>
);
const ToggleRow = ({ label, desc, checked, onChange }) => (
  <div className="flex items-center justify-between rounded-lg border p-3">
    <div>
      <div className="font-medium text-sm">{label}</div>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
    <Switch checked={!!checked} onCheckedChange={onChange} />
  </div>
);
const Img = ({ label, url, onUpload, wide }) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    <label className={`flex items-center justify-center cursor-pointer overflow-hidden rounded-lg border-2 border-dashed bg-muted/30 hover:bg-muted/50 transition ${wide ? 'h-24' : 'h-24 w-24'}`}>
      {url ? (
        <img src={url} alt={label} className="h-full w-full object-cover" />
      ) : (
        <div className="flex flex-col items-center justify-center text-muted-foreground text-xs"><ImagePlus className="h-5 w-5 mb-1" />Upload</div>
      )}
      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
    </label>
  </div>
);

export default SettingsClient;
