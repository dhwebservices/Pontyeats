'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const AdminRestaurantsClient = ({ restaurants: initial, stats }) => {
  const [restaurants, setRestaurants] = useState(initial);
  const supabase = createClient();

  const toggle = async (r, field) => {
    const { error } = await supabase.from('restaurants').update({ [field]: !r[field] }).eq('id', r.id);
    if (error) { toast.error(error.message); return; }
    setRestaurants(restaurants.map(x => x.id === r.id ? { ...x, [field]: !r[field] } : x));
    toast.success('Updated');
  };

  return (
    <div className="p-6 md:p-12 max-w-7xl">
      <h1 className="font-display text-4xl md:text-5xl font-semibold">Restaurants</h1>
      <p className="text-muted-foreground mt-2">{restaurants.length} signed up</p>
      <div className="mt-8 border-y divide-y">
        {restaurants.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground italic font-display text-2xl">No restaurants yet.</div>
        ) : restaurants.map(r => {
          const s = stats[r.id] || { count: 0, gross: 0 };
          return (
            <div key={r.id} className="py-4 grid grid-cols-12 items-center gap-4">
              <div className="col-span-4 flex items-center gap-3 min-w-0">
                {r.logo_url ? <img src={r.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-xs font-bold">{r.name?.charAt(0)}</div>}
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{r.cuisine_type || '—'} · {r.postal_code || '—'}</div>
                </div>
              </div>
              <div className="col-span-2 text-sm">{s.count} orders</div>
              <div className="col-span-2 text-sm font-display font-semibold">£{s.gross.toFixed(2)}</div>
              <div className="col-span-2 flex items-center gap-2"><span className="text-xs text-muted-foreground">Approved</span><Switch checked={r.is_approved} onCheckedChange={() => toggle(r, 'is_approved')} /></div>
              <div className="col-span-2 flex items-center gap-2"><span className="text-xs text-muted-foreground">Open</span><Switch checked={r.is_open} onCheckedChange={() => toggle(r, 'is_open')} /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminRestaurantsClient;
