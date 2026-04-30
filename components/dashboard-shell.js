'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ClipboardList, BookOpen, Settings, LogOut, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/orders', label: 'Live orders', icon: ClipboardList },
  { href: '/dashboard/menu', label: 'Menu', icon: BookOpen },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const DashboardShell = ({ restaurant, userEmail, children }) => {
  const pathname = usePathname();
  const statusLabel = restaurant?.is_approved
    ? restaurant?.is_open
      ? 'Live'
      : 'Closed'
    : 'Pending approval';
  const statusClasses = restaurant?.is_approved
    ? restaurant?.is_open
      ? 'bg-emerald-500/10 text-emerald-700'
      : 'bg-muted text-muted-foreground'
    : 'bg-amber-500/10 text-amber-700';
  return (
    <div className="min-h-screen bg-muted/30 flex">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
        <div className="px-5 py-5 border-b">
          <Link href="/" className="font-bold">Ponty Eats</Link>
        </div>
        <div className="px-3 py-3 border-b">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-sidebar-accent transition">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
              {(restaurant?.name || 'R').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{restaurant?.name || 'Your restaurant'}</div>
              <div className="mt-1 flex items-center gap-2">
                <div className="text-xs text-muted-foreground truncate">{restaurant?.city || 'Pontypridd'}</div>
                <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]', statusClasses)}>
                  {statusLabel}
                </span>
              </div>
            </div>
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                active
                  ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}>
                <Icon className="h-4 w-4" /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t">
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </form>
          <div className="px-3 mt-2 text-xs text-muted-foreground truncate">{userEmail}</div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <div className="md:hidden border-b bg-background px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-bold">Ponty Eats</Link>
          <form action="/auth/signout" method="post">
            <Button type="submit" size="sm" variant="ghost"><LogOut className="h-4 w-4" /></Button>
          </form>
        </div>
        <div className="md:hidden border-b bg-background overflow-x-auto">
          <div className="flex gap-1 px-2 py-2">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href} className={cn('flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap', active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>
                  <Icon className="h-3.5 w-3.5" /> {label}
                </Link>
              );
            })}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
};

export default DashboardShell;
