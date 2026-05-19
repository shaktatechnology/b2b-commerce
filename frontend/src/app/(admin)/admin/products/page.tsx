'use client';

import * as React from 'react';
import { apiFetch } from '@/src/lib/api';
import { getAuthToken } from '@/src/lib/auth';
import { Product, Category } from '@/src/types';
import { PageHeader } from '@/src/components/layout-components/page-wrapper';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Spinner } from '@/src/components/ui/spinner';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/src/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/src/components/ui/select';
import { 
  Edit2, 
  Trash2, 
  Plus, 
  X, 
  Image as ImageIcon, 
  Package, 
  Search, 
  Filter,
  Calendar,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';

export default function AdminProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [dateFilter, setDateFilter] = React.useState('all');

  // Form State
  const [formMode, setFormMode] = React.useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    stock: '',
    category_id: '',
  });
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const token = getAuthToken();

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        apiFetch<any>('/products'),
        apiFetch<any>('/categories')
      ]);
      setProducts(prodRes.data ? prodRes.data : prodRes);
      setCategories(catRes.data ? catRes.data : catRes);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category_id.toString() === categoryFilter;
    
    // Simple date filtering (example: last 7 days, last 30 days)
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const createdDate = new Date(product.created_at);
      const now = new Date();
      if (dateFilter === 'today') {
        matchesDate = createdDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        matchesDate = createdDate >= weekAgo;
      }
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  const openModal = (mode: 'create' | 'edit', product?: Product) => {
    setFormMode(mode);
    if (mode === 'edit' && product) {
      setEditingId(product.id);
      setFormData({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        price: product.price.toString(),
        stock: product.stock.toString(),
        category_id: product.category_id.toString(),
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        price: '',
        stock: '',
        category_id: '',
      });
    }
    setSelectedImage(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', slug: '', description: '', price: '', stock: '', category_id: '' });
    setSelectedImage(null);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const body = new FormData();
      Object.entries(formData).forEach(([key, value]) => body.append(key, value));
      if (selectedImage) body.append('image', selectedImage);

      if (formMode === 'create') {
        await apiFetch('/admin/products', {
          method: 'POST',
          token: token || undefined,
          body: body,
        });
        toast.success('Product created successfully');
      } else {
        body.append('_method', 'PUT');
        await apiFetch(`/admin/products/${editingId}`, {
          method: 'POST',
          token: token || undefined,
          body: body,
        });
        toast.success('Product updated successfully');
      }
      closeModal();
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await apiFetch(`/admin/products/${id}`, { method: 'DELETE', token: token || undefined });
      toast.success('Product deleted');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-8 font-lato">
      <PageHeader title="Product Management" description="Inventory, pricing, and catalog control.">
        <Button onClick={() => openModal('create')} className="bg-[#966FD6] hover:bg-[#7d5bbf] text-white rounded-xl h-11 px-6 shadow-lg shadow-[#966FD6]/20">
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </PageHeader>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Search products or slugs..." 
            className="pl-10 h-11 rounded-xl border-zinc-200 focus-visible:ring-[#966FD6]/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] h-11 rounded-xl border-zinc-200">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-zinc-400" />
                <SelectValue placeholder="Category" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[160px] h-11 rounded-xl border-zinc-200">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-zinc-400" />
                <SelectValue placeholder="Date" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Any Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-20"><Spinner size="lg" className="border-[#966FD6]" /></div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center p-20 text-zinc-500 font-medium">No products match your filters.</div>
        ) : (
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest">Product</TableHead>
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest">Pricing & Stock</TableHead>
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest">Details</TableHead>
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((p) => (
                <TableRow key={p.id} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                  <TableCell className="py-5 px-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 overflow-hidden shrink-0">
                        {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <Package className="size-6" />}
                      </div>
                      <div>
                        <p className="font-bold text-black/90 text-base">{p.name}</p>
                        <code className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded-md font-bold text-zinc-500 uppercase tracking-tight">/{p.slug}</code>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-6">
                    <div className="space-y-1">
                      <p className="font-black text-[#966FD6] text-lg">${p.price}</p>
                      <p className={cn("text-xs font-black uppercase tracking-widest", p.stock > 10 ? "text-green-600" : "text-red-500")}>
                        {p.stock} in stock
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-6">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-bold bg-[#966FD6]/5 text-[#966FD6] px-2 py-1 rounded-lg w-fit">{p.category?.name || 'Uncategorized'}</span>
                      <span className="text-[10px] text-zinc-400 font-medium">Added {new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-6 text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openModal('edit', p)} className="rounded-full text-zinc-400 hover:text-[#966FD6] hover:bg-[#966FD6]/5">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-8 border-b border-zinc-50">
              <h2 className="text-2xl font-black">{formMode === 'create' ? 'Add New Product' : 'Edit Product'}</h2>
              <Button variant="ghost" size="icon" onClick={closeModal} className="rounded-full"><X className="h-6 w-6" /></Button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Name</label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-12 rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Slug</label>
                  <Input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="h-12 rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Price ($)</label>
                  <Input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="h-12 rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Inventory Stock</label>
                  <Input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="h-12 rounded-xl" required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Category</label>
                <Select value={formData.category_id} onValueChange={v => setFormData({...formData, category_id: v})}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full min-h-[120px] p-4 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-[#966FD6]/20 transition-all text-sm resize-none" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Product Image</label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex flex-col items-center justify-center h-28 border-2 border-dashed border-zinc-100 rounded-3xl hover:bg-zinc-50 cursor-pointer transition-all group">
                    <ImageIcon className="h-8 w-8 text-zinc-300 group-hover:text-[#966FD6]/50" />
                    <span className="text-[10px] font-black uppercase mt-2 text-zinc-400">{selectedImage ? selectedImage.name : 'Update Photo'}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files && setSelectedImage(e.target.files[0])} />
                  </label>
                  {selectedImage && <div className="h-28 w-28 rounded-3xl overflow-hidden border border-zinc-100 shadow-inner"><img src={URL.createObjectURL(selectedImage)} className="w-full h-full object-cover" /></div>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={closeModal} className="font-bold text-zinc-400 rounded-xl">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-[#966FD6] hover:bg-[#7d5bbf] text-white px-10 h-12 rounded-xl font-black shadow-xl shadow-[#966FD6]/30 active:scale-95">
                  {isSubmitting ? <Spinner size="sm" className="border-white mr-2" /> : null}
                  {formMode === 'create' ? 'Create Product' : 'Update Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
