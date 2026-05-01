'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ClipboardList, Store, Settings, LogOut, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/restaurants', label: 'Restaurants', icon: Store },
  { href: '/admin/settings', label: 'Platform', icon: Settings },
];

const AdminShell = ({ userEmail, children }) => {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-sidebar">
        <div className="px-5 py-5 border-b">
          <Link href="/" className="font-display font-bold">Ponty Eats</Link>
          <div className="mt-1 text-xs uppercase tracking-widest text-primary font-mono">Admin</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                active ? 'bg-foreground text-background font-medium' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground')}>
                <Icon className="h-4 w-4" /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t">
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="ghost" className="w-full justify-start gap-2 text-muted-foreground"><LogOut className="h-4 w-4" /> Sign out</Button>
          </form>
          <div className="px-3 mt-2 text-xs text-muted-foreground truncate">{userEmail}</div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <div className="md:hidden border-b px-4 py-3 flex items-center justify-between">
          <Link href="/admin" className="font-display font-bold">Ponty Eats Admin</Link>
          <form action="/auth/signout" method="post"><Button type="submit" size="sm" variant="ghost"><LogOut className="h-4 w-4" /></Button></form>
        </div>
        <div className="md:hidden border-b overflow-x-auto">
          <div className="flex gap-1 px-2 py-2">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return <Link key={href} href={href} className={cn('flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap', active ? 'bg-foreground text-background' : 'text-muted-foreground')}><Icon className="h-3.5 w-3.5" />{label}</Link>;
            })}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
};

export default AdminShell;
