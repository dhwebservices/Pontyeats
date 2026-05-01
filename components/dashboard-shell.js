'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ClipboardList, BookOpen, Settings, LogOut, ChevronsUpDown, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, permission: null },
  { href: '/dashboard/orders', label: 'Live orders', icon: ClipboardList, permission: 'can_manage_orders' },
  { href: '/dashboard/menu', label: 'Menu', icon: BookOpen, permission: 'can_manage_menu' },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, permission: 'can_manage_settings' },
];

const DashboardShell = ({ restaurant, userEmail, children, isAdmin = false, permissions = {} }) => {
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
  const visibleNavItems = navItems.filter((item) => !item.permission || permissions[item.permission]);
  return (
    <div className="min-h-screen bg-muted/30 flex">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
        <div className="px-5 py-5 border-b">
          <Link href="/" className="font-bold">Ponty Eats</Link>
        </div>
        <div className="px-3 py-3 border-b">
          <div className="rounded-2xl border bg-background/70 px-3 py-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-semibold">
              {(restaurant?.name || 'R').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium leading-tight break-words">{restaurant?.name || 'Your restaurant'}</div>
                <div className="mt-1 text-xs text-muted-foreground truncate">{restaurant?.city || 'Pontypridd'}</div>
                <div className="mt-2">
                  <span className={cn('inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]', statusClasses)}>
                    {statusLabel}
                  </span>
                </div>
              </div>
              <ChevronsUpDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            {isAdmin && (
              <Link
                href="/admin"
                className="mt-3 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
              >
                <Shield className="h-3.5 w-3.5" />
                Open admin panel
              </Link>
            )}
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {visibleNavItems.map(({ href, label, icon: Icon }) => {
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
            {visibleNavItems.map(({ href, label, icon: Icon }) => {
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
