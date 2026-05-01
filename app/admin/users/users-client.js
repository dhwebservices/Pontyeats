'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Shield, Store, UserCog, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RESTAURANT_ACCESS_PRESETS, USER_ROLE_OPTIONS } from '@/lib/roles';

const EMPTY_FORM = {
  full_name: '',
  email: '',
  password: '',
  role: 'restaurant_staff',
  restaurant_id: '',
  restaurant_access_role: 'staff',
  access_status: 'active',
  can_manage_orders: true,
  can_manage_menu: false,
  can_manage_settings: false,
  can_manage_billing: false,
  can_manage_staff: false,
};

const AdminUsersClient = ({ users: initialUsers, restaurants }) => {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);

  const stats = useMemo(() => ({
    admins: users.filter((u) => u.role === 'admin').length,
    restaurantOwners: users.filter((u) => u.role === 'restaurant_owner' || u.role === 'restaurant').length,
    restaurantStaff: users.filter((u) => u.role === 'restaurant_staff').length,
  }), [users]);

  const setCreate = (key, value) => {
    setCreateForm((current) => {
      const next = { ...current, [key]: value };
      if (key === 'restaurant_access_role' && value === 'owner') {
        return { ...next, ...RESTAURANT_ACCESS_PRESETS.owner };
      }
      return next;
    });
  };

  const openEdit = (user) => {
    setEditingUser({
      user_id: user.id,
      full_name: user.full_name || '',
      role: user.role || 'customer',
      restaurant_id: user.access?.restaurant_id || '',
      restaurant_access_role: user.access?.role || 'staff',
      access_status: user.access?.status || 'active',
      can_manage_orders: !!user.access?.can_manage_orders,
      can_manage_menu: !!user.access?.can_manage_menu,
      can_manage_settings: !!user.access?.can_manage_settings,
      can_manage_billing: !!user.access?.can_manage_billing,
      can_manage_staff: !!user.access?.can_manage_staff,
    });
  };

  const closeEdit = () => setEditingUser(null);

  const createUser = async () => {
    if (!createForm.full_name || !createForm.email || !createForm.password) {
      toast.error('Name, email, and password are required.');
      return;
    }
    setCreating(true);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) {
      toast.error(data.error || 'Could not create user');
      return;
    }
    toast.success('User created');
    setCreateOpen(false);
    setCreateForm(EMPTY_FORM);
    router.refresh();
  };

  const saveUser = async () => {
    if (!editingUser) return;
    setSaving(true);
    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingUser),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(data.error || 'Could not update user');
      return;
    }
    toast.success('User updated');
    closeEdit();
    router.refresh();
  };

  return (
    <div className="p-6 md:p-12 max-w-7xl">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold">Users</h1>
          <p className="text-muted-foreground mt-2">Create admin accounts, add restaurant staff, and control who can access which parts of the platform.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-full"><Plus className="h-4 w-4" /> Add user</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create user</DialogTitle>
              <DialogDescription>Manual account creation for platform admins and restaurant teams.</DialogDescription>
            </DialogHeader>
            <UserForm form={createForm} setForm={setCreate} restaurants={restaurants} isCreate />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={createUser} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create user'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <StatCard icon={Shield} label="Platform admins" value={stats.admins} />
        <StatCard icon={Store} label="Restaurant owners" value={stats.restaurantOwners} />
        <StatCard icon={UserCog} label="Restaurant staff" value={stats.restaurantStaff} />
      </div>

      <div className="mt-8 divide-y rounded-3xl border bg-card">
        {users.length === 0 ? (
          <div className="px-6 py-16 text-center text-muted-foreground">
            No users yet.
          </div>
        ) : users.map((user) => (
          <div key={user.id} className="px-6 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="font-medium">{user.full_name || user.email}</div>
              <div className="text-sm text-muted-foreground truncate">{user.email}</div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <Chip>{labelForRole(user.role)}</Chip>
                {user.access?.restaurant?.name && <Chip>{user.access.restaurant.name}</Chip>}
                {user.access?.status === 'suspended' && <Chip tone="muted">Suspended</Chip>}
                {user.access?.role === 'owner' && <Chip tone="primary">Owner access</Chip>}
                {user.access?.role === 'staff' && <Chip tone="muted">Staff access</Chip>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => openEdit(user)}>Edit access</Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit access</DialogTitle>
            <DialogDescription>Adjust platform role, restaurant assignment, and dashboard permissions.</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <UserForm
              form={editingUser}
              setForm={(key, value) => setEditingUser((current) => {
                const next = { ...current, [key]: value };
                if (key === 'restaurant_access_role' && value === 'owner') {
                  return { ...next, ...RESTAURANT_ACCESS_PRESETS.owner };
                }
                return next;
              })}
              restaurants={restaurants}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeEdit}>Cancel</Button>
            <Button onClick={saveUser} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save access'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const UserForm = ({ form, setForm, restaurants, isCreate = false }) => {
  const isRestaurantUser = form.role === 'restaurant_owner' || form.role === 'restaurant_staff';

  return (
    <div className="grid gap-5 py-2">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full name">
          <Input value={form.full_name} onChange={(e) => setForm('full_name', e.target.value)} />
        </Field>
        {isCreate && (
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => setForm('email', e.target.value)} />
          </Field>
        )}
      </div>
      {isCreate && (
        <Field label="Password">
          <Input type="password" value={form.password} onChange={(e) => setForm('password', e.target.value)} />
        </Field>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="User type">
          <Select value={form.role} onValueChange={(value) => setForm('role', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {USER_ROLE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        {isRestaurantUser && (
          <Field label="Restaurant">
            <Select value={form.restaurant_id || undefined} onValueChange={(value) => setForm('restaurant_id', value)}>
              <SelectTrigger><SelectValue placeholder="Select a restaurant" /></SelectTrigger>
              <SelectContent>
                {restaurants.map((restaurant) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>{restaurant.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      </div>

      {isRestaurantUser && (
        <div className="rounded-2xl border bg-muted/20 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Restaurant access">
              <Select value={form.restaurant_access_role} onValueChange={(value) => setForm('restaurant_access_role', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {!isCreate && (
              <Field label="Access status">
                <Select value={form.access_status} onValueChange={(value) => setForm('access_status', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          </div>
          {form.restaurant_access_role === 'staff' && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <PermissionBox label="Orders" checked={!!form.can_manage_orders} onChange={(value) => setForm('can_manage_orders', value)} />
              <PermissionBox label="Menu" checked={!!form.can_manage_menu} onChange={(value) => setForm('can_manage_menu', value)} />
              <PermissionBox label="Settings" checked={!!form.can_manage_settings} onChange={(value) => setForm('can_manage_settings', value)} />
              <PermissionBox label="Billing" checked={!!form.can_manage_billing} onChange={(value) => setForm('can_manage_billing', value)} />
              <PermissionBox label="Staff management" checked={!!form.can_manage_staff} onChange={(value) => setForm('can_manage_staff', value)} />
            </div>
          )}
          {form.restaurant_access_role === 'owner' && (
            <p className="mt-4 text-sm text-muted-foreground">Owner access grants full orders, menu, settings, billing, and staff permissions.</p>
          )}
        </div>
      )}
    </div>
  );
};

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    {children}
  </div>
);

const PermissionBox = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-3 rounded-xl border bg-background px-3 py-3 text-sm">
    <Checkbox checked={checked} onCheckedChange={onChange} />
    <span>{label}</span>
  </label>
);

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-3xl border bg-card p-5">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4" />
      <span className="text-sm">{label}</span>
    </div>
    <div className="mt-3 font-display text-5xl font-semibold">{value}</div>
  </div>
);

const Chip = ({ children, tone = 'default' }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 font-medium ${
    tone === 'primary'
      ? 'bg-primary/10 text-primary'
      : tone === 'muted'
        ? 'bg-muted text-muted-foreground'
        : 'bg-foreground/5 text-foreground'
  }`}>
    {children}
  </span>
);

function labelForRole(role) {
  const match = USER_ROLE_OPTIONS.find((option) => option.value === role);
  if (match) return match.label;
  if (role === 'restaurant') return 'Restaurant owner';
  return role;
}

export default AdminUsersClient;

