'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, FolderPlus, X } from 'lucide-react';
import { toast } from 'sonner';

const MenuClient = ({ restaurant, initialCategories, initialItems }) => {
  const supabase = createClient();
  const [categories, setCategories] = useState(initialCategories);
  const [items, setItems] = useState(initialItems);
  const [catOpen, setCatOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  // Category form
  const [catName, setCatName] = useState('');
  const saveCategory = async () => {
    if (!catName.trim()) return;
    const { data, error } = await supabase.from('menu_categories').insert({
      restaurant_id: restaurant.id, name: catName.trim(), sort_order: categories.length,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setCategories([...categories, data]);
    setCatName(''); setCatOpen(false);
    toast.success('Category added');
  };
  const deleteCategory = async (id) => {
    if (!confirm('Delete this category? Items in it will become uncategorised.')) return;
    const { error } = await supabase.from('menu_categories').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setCategories(categories.filter(c => c.id !== id));
    setItems(items.map(i => i.category_id === id ? { ...i, category_id: null } : i));
  };

  const openNewItem = (categoryId = null) => {
    setEditingItem({
      id: null,
      restaurant_id: restaurant.id,
      category_id: categoryId,
      name: '', description: '', price: '',
      image_url: '', is_available: true, modifiers: [],
    });
    setItemOpen(true);
  };
  const openEditItem = (item) => {
    setEditingItem({ ...item, modifiers: item.modifiers || [] });
    setItemOpen(true);
  };

  const saveItem = async () => {
    if (!editingItem.name.trim() || !editingItem.price) { toast.error('Name and price required'); return; }
    const payload = {
      restaurant_id: restaurant.id,
      category_id: editingItem.category_id || null,
      name: editingItem.name.trim(),
      description: editingItem.description || null,
      price: Number(editingItem.price),
      image_url: editingItem.image_url || null,
      is_available: editingItem.is_available !== false,
      modifiers: editingItem.modifiers || [],
    };
    if (editingItem.id) {
      const { data, error } = await supabase.from('menu_items').update(payload).eq('id', editingItem.id).select().single();
      if (error) { toast.error(error.message); return; }
      setItems(items.map(i => i.id === data.id ? data : i));
      toast.success('Item updated');
    } else {
      const { data, error } = await supabase.from('menu_items').insert(payload).select().single();
      if (error) { toast.error(error.message); return; }
      setItems([...items, data]);
      toast.success('Item added');
    }
    setItemOpen(false); setEditingItem(null);
  };

  const deleteItem = async (id) => {
    if (!confirm('Delete this item?')) return;
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setItems(items.filter(i => i.id !== id));
  };

  const toggleAvailability = async (item) => {
    const newVal = !item.is_available;
    const { error } = await supabase.from('menu_items').update({ is_available: newVal }).eq('id', item.id);
    if (error) { toast.error(error.message); return; }
    setItems(items.map(i => i.id === item.id ? { ...i, is_available: newVal } : i));
  };

  // Image upload
  const uploadImage = async (file) => {
    const ext = file.name.split('.').pop();
    const path = `${restaurant.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('restaurant-assets').upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) { toast.error(error.message); return null; }
    const { data } = supabase.storage.from('restaurant-assets').getPublicUrl(path);
    return data.publicUrl;
  };

  const itemsByCat = (catId) => items.filter(i => i.category_id === catId);
  const uncategorized = items.filter(i => !i.category_id);

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Menu</h1>
          <p className="text-muted-foreground mt-1">{items.length} items in {categories.length} categories</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={catOpen} onOpenChange={setCatOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2"><FolderPlus className="h-4 w-4" /> New category</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New category</DialogTitle></DialogHeader>
              <div className="space-y-2 py-2">
                <Label htmlFor="catname">Name</Label>
                <Input id="catname" value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. Burgers" autoFocus />
              </div>
              <DialogFooter><Button onClick={saveCategory}>Add</Button></DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={() => openNewItem()} className="gap-2"><Plus className="h-4 w-4" /> New item</Button>
        </div>
      </div>

      {categories.length === 0 && items.length === 0 ? (
        <div className="rounded-2xl border bg-card p-16 text-center">
          <h3 className="font-semibold text-lg">Your menu is empty</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6">Start by creating a category like &ldquo;Starters&rdquo; or &ldquo;Mains&rdquo;.</p>
          <Button onClick={() => setCatOpen(true)} className="gap-2"><FolderPlus className="h-4 w-4" /> Create your first category</Button>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map(cat => (
            <CategorySection key={cat.id}
              category={cat}
              items={itemsByCat(cat.id)}
              onAddItem={() => openNewItem(cat.id)}
              onEditItem={openEditItem}
              onDeleteItem={deleteItem}
              onToggle={toggleAvailability}
              onDeleteCat={() => deleteCategory(cat.id)}
            />
          ))}
          {uncategorized.length > 0 && (
            <CategorySection
              category={{ name: 'Uncategorised' }}
              items={uncategorized}
              onAddItem={() => openNewItem(null)}
              onEditItem={openEditItem}
              onDeleteItem={deleteItem}
              onToggle={toggleAvailability}
            />
          )}
        </div>
      )}

      {/* Item dialog */}
      <Dialog open={itemOpen} onOpenChange={setItemOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingItem?.id ? 'Edit item' : 'New item'}</DialogTitle></DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input value={editingItem.name} onChange={(e) => setEditingItem({...editingItem, name: e.target.value})} placeholder="e.g. Cheeseburger" />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea rows={2} value={editingItem.description || ''} onChange={(e) => setEditingItem({...editingItem, description: e.target.value})} placeholder="Brief description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Price (£) *</Label>
                  <Input type="number" step="0.01" value={editingItem.price} onChange={(e) => setEditingItem({...editingItem, price: e.target.value})} placeholder="9.50" />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={editingItem.category_id || ''} onChange={(e) => setEditingItem({...editingItem, category_id: e.target.value || null})}>
                    <option value="">Uncategorised</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Photo</Label>
                <div className="flex items-center gap-3">
                  {editingItem.image_url && <img src={editingItem.image_url} alt="" className="h-16 w-16 rounded-lg object-cover" />}
                  <input type="file" accept="image/*" onChange={async (e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    const url = await uploadImage(f);
                    if (url) { setEditingItem({...editingItem, image_url: url}); toast.success('Image uploaded'); }
                  }} className="text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Modifiers / Extras</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingItem({...editingItem, modifiers: [...(editingItem.modifiers||[]), { name: '', price: 0 }]})}><Plus className="h-3 w-3 mr-1" />Add</Button>
                </div>
                {(editingItem.modifiers || []).map((m, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={m.name} onChange={(e) => {
                      const mods = [...editingItem.modifiers];
                      mods[i] = { ...mods[i], name: e.target.value };
                      setEditingItem({...editingItem, modifiers: mods});
                    }} placeholder="e.g. Extra cheese" />
                    <Input type="number" step="0.01" value={m.price} onChange={(e) => {
                      const mods = [...editingItem.modifiers];
                      mods[i] = { ...mods[i], price: Number(e.target.value) };
                      setEditingItem({...editingItem, modifiers: mods});
                    }} placeholder="+£" className="w-24" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => {
                      const mods = editingItem.modifiers.filter((_, j) => j !== i);
                      setEditingItem({...editingItem, modifiers: mods});
                    }}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Available</Label>
                  <p className="text-xs text-muted-foreground">Customers can order this item</p>
                </div>
                <Switch checked={editingItem.is_available !== false} onCheckedChange={(v) => setEditingItem({...editingItem, is_available: v})} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {editingItem?.id && <Button variant="ghost" onClick={() => { deleteItem(editingItem.id); setItemOpen(false); }} className="text-red-600"><Trash2 className="h-4 w-4 mr-1" />Delete</Button>}
            <Button onClick={saveItem}>{editingItem?.id ? 'Save changes' : 'Add item'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const CategorySection = ({ category, items, onAddItem, onEditItem, onDeleteItem, onToggle, onDeleteCat }) => (
  <div className="rounded-2xl border bg-card overflow-hidden">
    <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
      <div className="flex items-center gap-3">
        <h2 className="font-semibold">{category.name}</h2>
        <span className="text-xs text-muted-foreground">{items.length} item{items.length===1?'':'s'}</span>
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={onAddItem}><Plus className="h-4 w-4" /></Button>
        {onDeleteCat && <Button size="sm" variant="ghost" onClick={onDeleteCat} className="text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>}
      </div>
    </div>
    {items.length === 0 ? (
      <div className="px-5 py-6 text-sm text-muted-foreground text-center">No items yet — <button onClick={onAddItem} className="text-primary hover:underline">add one</button></div>
    ) : (
      <div className="divide-y">
        {items.map(item => (
          <div key={item.id} className="px-5 py-4 flex items-center gap-4 hover:bg-muted/30">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="h-14 w-14 rounded-lg object-cover" />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-2xl">🍽️</div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{item.name} {!item.is_available && <span className="text-xs ml-2 text-muted-foreground">(unavailable)</span>}</div>
              {item.description && <div className="text-sm text-muted-foreground truncate">{item.description}</div>}
            </div>
            <div className="font-semibold w-16 text-right">£{Number(item.price).toFixed(2)}</div>
            <Switch checked={item.is_available} onCheckedChange={() => onToggle(item)} />
            <Button size="icon" variant="ghost" onClick={() => onEditItem(item)}><Pencil className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default MenuClient;
