'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export const TestOrderButton = ({ restaurantId }) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const fire = async () => {
    setLoading(true);
    const res = await fetch('/api/orders/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurant_id: restaurantId }),
    });
    setLoading(false);
    if (!res.ok) { toast.error('Failed to create test order'); return; }
    toast.success('Test order sent!', { description: 'Watch it arrive in real time.' });
    router.refresh();
  };
  return (
    <Button onClick={fire} disabled={loading} className="gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      Send test order
    </Button>
  );
};
