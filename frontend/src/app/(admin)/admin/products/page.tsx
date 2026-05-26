'use client';

import * as React from 'react';
import { apiFetch } from '@/src/lib/api';
import { getAuthToken } from '@/src/lib/auth';
import { Product, Category, ProductVariant, Discount } from '@/src/types';
import { PageHeader } from '@/src/components/layout-components/page-wrapper';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Spinner } from '@/src/components/ui/spinner';
import { Skeleton } from '@/src/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Edit2, Trash2, Plus, X, Image as ImageIcon, Package, Search, Calendar, Tag, Check, FilterX, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';
import { DatePicker } from '@/src/components/ui/date-picker';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import PreviewPage from '@/src/app/preview/page';

const initialVariant: ProductVariant = {
  variant_name: 'Default',
  sku: '',
  retail_price: 0,
  wholesale_price: 0,
  moq: 1,
  stock: 0,
  weight: '',
  color_id: '',
  size_id: '',
  is_active: true,
  discount: null,
};

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  long_description: '',
  is_active: true,
  category_ids: [] as string[],
  brand_id: '',
  color_id: '',
  size_id: '',
  weight: '',
  variants: [] as ProductVariant[],

  is_popular: false,
  is_top_selling:false,
  is_trending:false,
  discount: null as Discount | null,
};

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

const generateSKU = (name: string = 'PROD') => {
  const prefix = name.slice(0, 3).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${random}`;
};

export default function AdminProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [brands, setBrands] = React.useState<any[]>([]);
  const [colors, setColors] = React.useState<any[]>([]);
  const [sizes, setSizes] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>();
  const [dateTo, setDateTo] = React.useState<Date | undefined>();
  const [page, setPage] = React.useState(1);

  // Form State
  const [formMode, setFormMode] = React.useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = React.useState<string | number | null>(null);
  const [formData, setFormData] = React.useState({ ...emptyForm });
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [existingImage, setExistingImage] = React.useState<string>('');
  const [removeExistingImage, setRemoveExistingImage] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const token = getAuthToken();

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const freshToken = getAuthToken();
      const [prodRes, catRes, brandsRes, colorsRes, sizesRes] = await Promise.all([
        apiFetch<any>(`/products?include_inactive=1&status=all&page=${page}`, { token: freshToken || undefined }),
        apiFetch<any>('/categories?include_inactive=1&all=1&status=all', { token: freshToken || undefined }),
        apiFetch<any>('/brands', { token: freshToken || undefined }),
        apiFetch<any>('/colors', { token: freshToken || undefined }),
        apiFetch<any>('/sizes', { token: freshToken || undefined }),
      ]);

      let categoriesData: Category[] = [];
      if (Array.isArray(catRes)) categoriesData = catRes;
      else if (Array.isArray(catRes?.data)) categoriesData = catRes.data;
      else if (Array.isArray(catRes?.data?.data)) categoriesData = catRes.data.data;

      let productsData: Product[] = [];
      if (Array.isArray(prodRes)) productsData = prodRes;
      else if (Array.isArray(prodRes?.data)) productsData = prodRes.data;
      else if (Array.isArray(prodRes?.data?.data)) productsData = prodRes.data.data;

      productsData.sort((a, b) =>{
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

      });

      setCategories(categoriesData);
      setProducts(productsData);
      setBrands(brandsRes?.data || []);
      setColors(colorsRes?.data || []);
      setSizes(sizesRes?.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData, page]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.slug.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check if any category matches
    const matchesCategory = categoryFilter === 'all' || 
      (product.categories?.some(cat => cat.id.toString() === categoryFilter) ?? false);

    let matchesDate = true;
    if (product.created_at) {
      const prodDate = new Date(product.created_at);
      if (dateFrom && dateTo) {
        matchesDate = isWithinInterval(prodDate, { 
          start: startOfDay(dateFrom), 
          end: endOfDay(dateTo) 
        });
      } else if (dateFrom) {
        matchesDate = prodDate >= startOfDay(dateFrom);
      } else if (dateTo) {
        matchesDate = prodDate <= endOfDay(dateTo);
      }
    } else if (dateFrom || dateTo) {
      matchesDate = false;
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const openModal = (mode: 'create' | 'edit', product?: Product) => {
    setFormMode(mode);
    if (mode === 'edit' && product) {
      setEditingId(product.id);
      setFormData({
        name: product.name,
        slug: product.slug,

        description: product.description || '',
        long_description: product.long_description || '',
        is_active: Boolean(product.is_active),
        category_ids: product.categories?.map(c => c.id.toString()) || [],
        brand_id: product.brand_id || '',
        color_id: product.color_id || '',
        size_id: product.size_id || '',
        weight: product.weight || '',
        discount: product.discounts?.[0] ? {
           type: product.discounts[0].type,
           value: product.discounts[0].value,
           starts_at: product.discounts[0].starts_at ? product.discounts[0].starts_at.split('T')[0] : '',
           ends_at: product.discounts[0].ends_at ? product.discounts[0].ends_at.split('T')[0] : '',
           is_active: product.discounts[0].is_active,
        } : null,
        variants: product.variants.length > 0 ? product.variants.map((v: any) => ({
          ...v, 
          color_id: v.color_id || '', 
          size_id: v.size_id || '', 
          weight: v.weight || '',
          discount: v.discounts?.[0] ? {
             type: v.discounts[0].type,
             value: v.discounts[0].value,
             starts_at: v.discounts[0].starts_at ? v.discounts[0].starts_at.split('T')[0] : '',
             ends_at: v.discounts[0].ends_at ? v.discounts[0].ends_at.split('T')[0] : '',
             is_active: v.discounts[0].is_active,
          } : null
        })) : [{ ...initialVariant }],
        is_popular: Boolean(product.is_popular),
        is_top_selling: Boolean(product.is_top_selling),
        is_trending: Boolean(product.is_trending),
      });
      // Set existing image from available fields
      const imgPath = product.image || product.thumbnail || product.image_url || product.images?.[0]?.url || '';
      setExistingImage(imgPath);
    } else {
      setEditingId(null);
      const newProductSKU = generateSKU();
      setFormData({ 
        ...emptyForm, 
        variants: [{ ...initialVariant, sku: newProductSKU }] 
      });
      setExistingImage('');
    }
    setSelectedImage(null);
    setRemoveExistingImage(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ ...emptyForm, variants: [{ ...initialVariant }] });
    setSelectedImage(null);
    setExistingImage('');
    setRemoveExistingImage(false);
    setEditingId(null);
  };

  const toggleCategory = (id: string) => {
    setFormData((prev) => {
      const already = prev.category_ids.includes(id);
      return {
        ...prev,
        category_ids: already
          ? prev.category_ids.filter((c) => c !== id)
          : [...prev.category_ids, id],
      };
    });
  };

  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        // ...prev.variants, { ...initialVariant, sku: generateSKU(prev.name || 'VAR') }],
         { ...initialVariant, sku: generateSKU(prev.name || 'VAR') },
        ...prev.variants,
      ],
    }));
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    setFormData((prev) => {
      const updated = [...prev.variants];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, variants: updated };
    });
  };

  const removeVariant = (index: number) => {
    if (formData.variants.length <= 1) {
       toast.error("At least one variant is required");
       return;
    }
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.category_ids.length === 0) {
      toast.error('Please select at least one category.');
      return;
    }
    if (formData.variants.length === 0) {
      toast.error('At least one variant is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const freshToken = getAuthToken();
      const body = new FormData();
      body.append('name', formData.name);
      body.append('slug', formData.slug);
      body.append('description', formData.description);
      body.append('long_description', formData.long_description);
      body.append('is_active', formData.is_active ? '1' : '0');
      body.append('is_popular', formData.is_popular ? '1' : '0');
      body.append('is_top_selling', formData.is_top_selling ? '1' : '0');
      body.append('is_trending', formData.is_trending ? '1' : '0');

      body.append('brand_id', formData.brand_id || '');
      body.append('color_id', formData.color_id || '');
      body.append('size_id', formData.size_id || '');
      body.append('weight', formData.weight || '');

      formData.category_ids.forEach((id) => body.append('category_ids[]', id));

      if (formData.discount && formData.discount.type && formData.discount.value !== '' && formData.discount.starts_at && formData.discount.ends_at) {
        body.append('discount[type]', formData.discount.type);
        body.append('discount[value]', String(formData.discount.value));
        body.append('discount[starts_at]', formData.discount.starts_at);
        body.append('discount[ends_at]', formData.discount.ends_at);
        body.append('discount[is_active]', formData.discount.is_active ? '1' : '0');
      }

      formData.variants.forEach((v, i) => {
        if (v.id) body.append(`variants[${i}][id]`, String(v.id));
        body.append(`variants[${i}][variant_name]`, v.variant_name);
        body.append(`variants[${i}][sku]`, v.sku);
        body.append(`variants[${i}][retail_price]`, String(v.retail_price));
        body.append(`variants[${i}][wholesale_price]`, String(v.wholesale_price));
        body.append(`variants[${i}][moq]`, String(v.moq));
        body.append(`variants[${i}][stock]`, String(v.stock));
        body.append(`variants[${i}][weight]`, String(v.weight || ''));
        body.append(`variants[${i}][color_id]`, v.color_id || '');
        body.append(`variants[${i}][size_id]`, v.size_id || '');
        body.append(`variants[${i}][is_active]`, v.is_active ? '1' : '0');
        if (v.image) {
          body.append(`variants[${i}][image]`, v.image);
        } else if (v.image_url) {
          body.append(`variants[${i}][image_url]`, v.image_url);
        }

        if (v.discount && v.discount.type && v.discount.value !== '' && v.discount.starts_at && v.discount.ends_at) {
          body.append(`variants[${i}][discount][type]`, v.discount.type);
          body.append(`variants[${i}][discount][value]`, String(v.discount.value));
          body.append(`variants[${i}][discount][starts_at]`, v.discount.starts_at);
          body.append(`variants[${i}][discount][ends_at]`, v.discount.ends_at);
          body.append(`variants[${i}][discount][is_active]`, v.discount.is_active ? '1' : '0');
        }
      });

      if (formMode === 'create') {
        const response: any = await apiFetch('/admin/products', { method: 'POST', token: freshToken || undefined, body });
        
        // Find ID in data, data.data, or top level
        const productId = response?.data?.id || response?.data?.data?.id || response?.id;
        
        if (selectedImage && productId) {
          const imageBody = new FormData();
          imageBody.append('image', selectedImage);
          imageBody.append('is_primary', '1');
          imageBody.append('sort_order', '1');
          await apiFetch(`/admin/products/${productId}/images`, { 
            method: 'POST', 
            token: freshToken || undefined, 
            body: imageBody 
          });
        }
        
        toast.success('Product created successfully');
      } else {
        body.append('_method', 'PUT');
        await apiFetch(`/admin/products/${editingId}`, { method: 'POST', token: freshToken || undefined, body });
        
        if (selectedImage && editingId) {
          const imageBody = new FormData();
          imageBody.append('image', selectedImage);
          imageBody.append('is_primary', '1');
          imageBody.append('sort_order', '1');
          await apiFetch(`/admin/products/${editingId}/images`, { 
            method: 'POST', 
            token: freshToken || undefined, 
            body: imageBody 
          });
        } else if (removeExistingImage && editingId) {
          await apiFetch(`/admin/products/${editingId}/images`, {
            method: 'DELETE',
            token: freshToken || undefined,
          });
        }
        
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

  const handleDelete = async (id: string | number) => {
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
      <PageHeader title="Product Management" description="Catalog, pricing, and variant control.">
        <Button
          onClick={() => openModal('create')}
          className="bg-[#966FD6] hover:bg-[#7d5bbf] text-white rounded-xl h-11 px-6 shadow-lg shadow-[#966FD6]/20"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
        <div className="relative flex-1 max-w-sm min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <Input 
            placeholder="Search products or slugs..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 rounded-xl focus-visible:ring-[#966FD6] border-zinc-200 font-medium"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-xl border-zinc-200 bg-white">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-zinc-400" />
                <SelectValue placeholder="Category" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">From:</span>
              <div className="w-50">
                <DatePicker 
                  date={dateFrom} 
                  setDate={setDateFrom} 
                  placeholder="Start Date" 
                  disabled={dateTo ? { after: dateTo } : undefined}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">To:</span>
              <div className="w-50">
                <DatePicker 
                  date={dateTo} 
                  setDate={setDateTo} 
                  placeholder="End Date" 
                  disabled={dateFrom ? { before: dateFrom } : undefined}
                />
              </div>
            </div>
          </div>

          {(searchQuery || categoryFilter !== 'all' || dateFrom || dateTo) && (
            <Button 
              variant="ghost" 
              onClick={clearFilters}
              className="h-11 px-4 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all font-bold gap-2"
            >
              <FilterX className="size-4" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 overflow-hidden relative">
        <div className="flex items-center justify-between border-b border-zinc-50 px-6 py-5 bg-zinc-50/30">
          <h2 className="text-lg font-black text-black">Product Registry</h2>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-zinc-400">
              Page {page}
            </span>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                disabled={page <= 1 || isLoading} 
                onClick={() => setPage(p => p - 1)}
                className="size-8 rounded-lg"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                disabled={isLoading}
                onClick={() => setPage(p => p + 1)}
                className="size-8 rounded-lg"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest">Product</TableHead>
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest">Pricing (Base)</TableHead>
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest">Categories</TableHead>
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest text-center">Status</TableHead>
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-zinc-50">
                    <TableCell className="py-5 px-6">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-14 w-14 rounded-2xl shrink-0" />
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <div className="flex gap-1">
                        <Skeleton className="h-5 w-16 rounded-lg" />
                        <Skeleton className="h-5 w-16 rounded-lg" />
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6 text-center">
                      <div className="flex justify-center">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center p-20 text-zinc-500 font-medium italic">
                    No products match your current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((p) => (
                  <TableRow key={p.id} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                    <TableCell className="py-5 px-6">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 overflow-hidden shrink-0">
                          {p.image || p.thumbnail || p.image_url || (p.images && p.images.length > 0) ? (
                            <img 
                              src={(() => {
                                const path = p.image || p.thumbnail || p.image_url || p.images?.[0]?.url || '';
                                if (!path) return '';
                                if (path.startsWith('http')) return path;
                                return `http://localhost:8000${path}`;
                              })()} 
                              className="w-full h-full object-cover" 
                              alt={p.name} 
                            />
                          ) : (
                            <Package className="size-6" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-black/90 text-base">{p.name}</p>
                          <code className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded-md font-bold text-zinc-500 uppercase tracking-tight">
                            /{p.slug}
                          </code>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <div className="space-y-1">
                        <p className="font-black text-[#966FD6] text-lg">
                          ${p.variants?.[0]?.retail_price || '0'}
                        </p>
                        <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
                          {p.variants?.length || 0} variants
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <div className="flex flex-wrap gap-1">
                        {(p.categories || []).map(cat => (
                          <span key={cat.id} className="text-[10px] font-bold bg-[#966FD6]/5 text-[#966FD6] px-2 py-1 rounded-lg">
                            {cat.name}
                          </span>
                        ))}
                        {(!p.categories || p.categories.length === 0) && <span className="text-xs text-zinc-400">Uncategorized</span>}
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6 text-center">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        p.is_active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                      )}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="py-5 px-6 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openModal('edit', p)}
                        className="rounded-full text-zinc-400 hover:text-[#966FD6] hover:bg-[#966FD6]/5"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(p.id)}
                        className="rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-zinc-50/95 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
          <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="ghost" size="icon" onClick={closeModal} className="rounded-full bg-white shadow-sm border border-zinc-200 h-12 w-12 hover:bg-zinc-100 shrink-0">
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <h2 className="text-3xl font-black">
                {formMode === 'create' ? 'Add New Product' : 'Edit Product'}
              </h2>
            </div>
            
            <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col border border-zinc-100 mb-8">
            <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Basic Information</label>
                      <div className="space-y-4">
                        <div className="space-y-1">
                           <span className="text-xs font-bold text-zinc-500">Name <span className="text-red-500">*</span></span>
                           <Input 
                             value={formData.name} 
                             onChange={(e) => {
                               const name = e.target.value;
                               const updatedVariants = [...formData.variants];
                               if (updatedVariants[0]) {
                                 updatedVariants[0].sku = generateSKU(name);
                               }
                               setFormData({ 
                                 ...formData, 
                                 name, 
                                 slug: slugify(name),
                                 variants: updatedVariants
                               });
                             }} 
                             className="h-12 rounded-xl" 
                             required 
                           />
                        </div>
                        <div className="space-y-1">
                           <span className="text-xs font-bold text-zinc-500">Slug <span className="text-red-500">*</span></span>
                           <Input 
                             value={formData.slug} 
                             onChange={(e) => setFormData({ ...formData, slug: e.target.value })} 
                             className="h-12 rounded-xl bg-zinc-50/50" 
                             required 
                           />
                        </div>
                        <div className="space-y-3 pt-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                          Product Status
                        </label>

                        {/* Active */}
                        <label className="flex items-center justify-between cursor-pointer group">
                          <span className="text-sm font-bold text-zinc-600 group-hover:text-black">
                            Product is Active
                          </span>

                          <input
                            type="checkbox"
                            checked={!!formData.is_active}
                            onChange={(e) =>
                              setFormData({ ...formData, is_active: e.target.checked })
                            }
                            className="h-4 w-4 accent-[#966FD6]"
                          />
                        </label>

                        {/* Popular */}
                        <label className="flex items-center justify-between cursor-pointer group">
                          <span className="text-sm font-bold text-zinc-600 group-hover:text-black">
                            Popular Product
                          </span>

                          <input
                            type="checkbox"
                            checked={!!formData.is_popular}
                            onChange={(e) =>
                              setFormData({ ...formData, is_popular: e.target.checked })
                            }
                            className="h-4 w-4 accent-[#966FD6]"
                          />
                        </label>

                        {/* Top Selling */}
                        <label className="flex items-center justify-between cursor-pointer group">
                          <span className="text-sm font-bold text-zinc-600 group-hover:text-black">
                            Top Selling
                          </span>

                          <input
                            type="checkbox"
                            checked={!!formData.is_top_selling}
                            onChange={(e) =>
                              setFormData({ ...formData, is_top_selling: e.target.checked })
                            }
                            className="h-4 w-4 accent-[#966FD6]"
                          />
                        </label>

                        {/* Trending */}
                        <label className="flex items-center justify-between cursor-pointer group">
                          <span className="text-sm font-bold text-zinc-600 group-hover:text-black">
                            Trending
                          </span>

                          <input
                            type="checkbox"
                            checked={!!formData.is_trending}
                            onChange={(e) =>
                              setFormData({ ...formData, is_trending: e.target.checked })
                            }
                            className="h-4 w-4 accent-[#966FD6]"
                          />
                        </label>
                      </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2 col-span-2 sm:col-span-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                        Categories <span className="text-red-500">*</span>
                      </label>

                      <Select>
                        <SelectTrigger className="h-12 rounded-xl border-zinc-200 bg-white font-bold">
                          <SelectValue
                            placeholder={
                              formData.category_ids.length > 0
                                ? `${formData.category_ids.length} selected`
                                : "Select Categories"
                            }
                          />
                        </SelectTrigger>

                        <SelectContent className="rounded-xl">
                          {categories.map((c) => {
                            const selected = formData.category_ids.includes(c.id.toString());

                            return (
                              <div
                                key={c.id}
                                onClick={() => toggleCategory(c.id.toString())}
                                className={cn(
                                  "flex items-center justify-between px-3 py-2 cursor-pointer rounded-md",
                                  selected && "bg-[#966FD6]/10 text-[#966FD6] font-bold"
                                )}
                              >
                                <span>{c.name}</span>
                                {selected && <Check className="h-4 w-4" />}
                              </div>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Brand</label>
                        <Select 
                          value={formData.brand_id || 'none'} 
                          onValueChange={(val) => setFormData({ ...formData, brand_id: val === 'none' ? '' : val })}
                        >
                          <SelectTrigger className="h-12 rounded-xl border-zinc-200 bg-white font-bold">
                            <SelectValue placeholder="Select Brand" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="none">No Brand</SelectItem>
                            {brands.map((b) => (
                              <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                     </div>
                     {!formData.weight && (
                       <>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Color (Default)</label>
                            <Select 
                              value={formData.color_id || 'none'} 
                              onValueChange={(val) => setFormData({ ...formData, color_id: val === 'none' ? '' : val })}
                            >
                              <SelectTrigger className="h-12 rounded-xl border-zinc-200 bg-white font-bold">
                                <SelectValue placeholder="Select Color" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="none">No Color</SelectItem>
                                {colors.map((c) => (
                                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Size (Default)</label>
                            <Select 
                              value={formData.size_id || 'none'} 
                              onValueChange={(val) => setFormData({ ...formData, size_id: val === 'none' ? '' : val })}
                            >
                              <SelectTrigger className="h-12 rounded-xl border-zinc-200 bg-white font-bold">
                                <SelectValue placeholder="Select Size" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="none">No Size</SelectItem>
                                {sizes.map((s) => (
                                  <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                         </div>
                       </>
                     )}
                     {!formData.color_id && !formData.size_id && (
                       <div className="space-y-2 col-span-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Weight (String, e.g. 15kg)</label>
                          <Input 
                            value={formData.weight || ''} 
                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })} 
                            className="h-12 rounded-xl bg-white border-zinc-200"
                          />
                       </div>
                     )}
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Product Media</label>
                      <div className="flex items-center gap-4">
                        <label className="flex-1 flex flex-col items-center justify-center h-32 border-2 border-dashed border-zinc-100 rounded-3xl hover:bg-zinc-50 cursor-pointer transition-all group">
                          <ImageIcon className="h-8 w-8 text-zinc-300 group-hover:text-[#966FD6]/50" />
                          <span className="text-[10px] font-black uppercase mt-2 text-zinc-400 text-center">
                            {selectedImage ? selectedImage.name : 'Click to Upload Image'}
                          </span>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setSelectedImage(e.target.files[0])} />
                        </label>
                        {selectedImage ? (
                          <div className="h-32 w-32 rounded-3xl overflow-hidden border border-zinc-100 shadow-md relative group">
                            <img src={URL.createObjectURL(selectedImage)} className="w-full h-full object-cover" alt="New preview" />
                            <button 
                              type="button"
                              onClick={() => setSelectedImage(null)}
                              className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                              <Trash2 className="size-5" />
                            </button>
                          </div>
                        ) : existingImage && !removeExistingImage ? (
                          <div className="h-32 w-32 rounded-3xl overflow-hidden border border-zinc-100 shadow-md relative group shrink-0">
                            <img 
                              src={existingImage.startsWith('http') ? existingImage : `http://localhost:8000${existingImage}`} 
                              className="w-full h-full object-cover" 
                              alt="Current" 
                            />
                            <button
                              type="button"
                              onClick={() => setRemoveExistingImage(true)}
                              className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                              <Trash2 className="size-5" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] font-bold uppercase text-center py-1 tracking-wider pointer-events-none">Current</div>
                          </div>
                        ) : null}
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Short Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Detail the product's features, specs, and selling points..."
                        className="w-full min-h-[148px] p-5 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-[#966FD6]/20 transition-all text-sm resize-none bg-zinc-50/30"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Long Description</label>
                      <textarea
                        value={formData.long_description}
                        onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                        placeholder="Comprehensive details for the product page..."
                        className="w-full min-h-[200px] p-5 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-[#966FD6]/20 transition-all text-sm resize-none bg-zinc-50/30"
                      />
                   </div>

                   <div className="space-y-4 pt-4 border-t border-zinc-100">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Product Discount (Applies to all variants)</label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={formData.discount !== null} onChange={(e) => {
                             if (e.target.checked) {
                               setFormData({ ...formData, discount: { type: 'percent', value: 10, starts_at: new Date().toISOString().split('T')[0], ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_active: true } });
                             } else {
                               setFormData({ ...formData, discount: null });
                             }
                          }} className="accent-[#966FD6] h-4 w-4" />
                          <span className="text-[10px] font-black uppercase text-[#966FD6]">Enable Parent Discount</span>
                        </label>
                      </div>
                      {formData.discount && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-50/50 rounded-2xl border border-[#966FD6]/20 animate-in fade-in duration-200">
                           <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase text-zinc-400">Discount Type</span>
                              <Select 
                                value={formData.discount.type} 
                                onValueChange={(val: any) => setFormData({ ...formData, discount: { ...formData.discount!, type: val } })}
                              >
                                <SelectTrigger className="h-10 rounded-xl border-zinc-200 bg-white text-xs">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="percent">Percentage (%)</SelectItem>
                                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                                </SelectContent>
                              </Select>
                           </div>
                           <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase text-zinc-400">Discount Value</span>
                              <Input type="number" value={formData.discount.value} onChange={(e) => setFormData({ ...formData, discount: { ...formData.discount!, value: e.target.value === '' ? '' : Number(e.target.value) } })} className="h-10 rounded-xl bg-white border-zinc-200 text-xs" />
                           </div>
                           <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase text-zinc-400">Starts At</span>
                              <Input type="date" value={formData.discount.starts_at} onChange={(e) => setFormData({ ...formData, discount: { ...formData.discount!, starts_at: e.target.value } })} className="h-10 rounded-xl bg-white border-zinc-200 text-xs" />
                           </div>
                           <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase text-zinc-400">Ends At</span>
                              <Input type="date" value={formData.discount.ends_at} onChange={(e) => setFormData({ ...formData, discount: { ...formData.discount!, ends_at: e.target.value } })} className="h-10 rounded-xl bg-white border-zinc-200 text-xs" />
                           </div>
                           <div className="col-span-2 flex items-center justify-end border-t border-zinc-100 pt-3">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.discount.is_active} onChange={(e) => setFormData({ ...formData, discount: { ...formData.discount!, is_active: e.target.checked } })} className="accent-[#966FD6] h-4 w-4" />
                                <span className="text-[10px] font-black uppercase text-zinc-500">Discount Active</span>
                              </label>
                           </div>
                        </div>
                      )}
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Variants</label>
                        <Button type="button" size="sm" variant="outline" onClick={addVariant} className="rounded-xl border-[#966FD6]/30 text-[#966FD6] hover:bg-[#966FD6]/5 font-black h-9 px-4">
                          <Plus className="h-4 w-4 mr-2" /> Add Variant
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {formData.variants.map((v, i) => (
                          <div key={i} className="p-6 bg-zinc-50/80 rounded-[24px] border border-zinc-100 shadow-sm relative animate-in fade-in zoom-in-95 duration-300">
                             <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(i)} className="absolute -top-2 -right-2 h-8 w-8 bg-white shadow-md border border-zinc-100 rounded-full text-zinc-400 hover:text-red-500">
                               <X className="w-4 h-4" />
                             </Button>
                             
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                   <span className="text-[10px] font-black uppercase text-zinc-400">Variant Name (Color/Size) <span className="text-red-500">*</span></span>
                                   <Input value={v.variant_name} onChange={(e) => updateVariant(i, 'variant_name', e.target.value)} className="h-10 rounded-xl bg-white border-zinc-200" required />
                                </div>
                                <div className="space-y-1">
                                   <span className="text-[10px] font-black uppercase text-zinc-400">SKU Code <span className="text-red-500">*</span></span>
                                   <Input value={v.sku} onChange={(e) => updateVariant(i, 'sku', e.target.value)} className="h-10 rounded-xl bg-white border-zinc-200" required />
                                </div>
                                <div className="space-y-1">
                                   <span className="text-[10px] font-black uppercase text-zinc-400">Retail Price <span className="text-red-500">*</span></span>
                                   <Input type="number" step="0.01" value={v.retail_price} onChange={(e) => updateVariant(i, 'retail_price', Number(e.target.value))} className="h-10 rounded-xl bg-white border-zinc-200" required />
                                </div>
                                <div className="space-y-1">
                                   <span className="text-[10px] font-black uppercase text-zinc-400">Wholesale Price <span className="text-red-500">*</span></span>
                                   <Input type="number" step="0.01" value={v.wholesale_price} onChange={(e) => updateVariant(i, 'wholesale_price', Number(e.target.value))} className="h-10 rounded-xl bg-white border-zinc-200" required />
                                </div>
                                <div className="space-y-1">
                                   <span className="text-[10px] font-black uppercase text-zinc-400">Inventory Stock <span className="text-red-500">*</span></span>
                                   <Input type="number" value={v.stock} onChange={(e) => updateVariant(i, 'stock', Number(e.target.value))} className="h-10 rounded-xl bg-white border-zinc-200" required />
                                </div>
                                <div className="space-y-1">
                                   <span className="text-[10px] font-black uppercase text-zinc-400">MOQ <span className="text-red-500">*</span></span>
                                   <Input type="number" value={v.moq} onChange={(e) => updateVariant(i, 'moq', Number(e.target.value))} className="h-10 rounded-xl bg-white border-zinc-200" required />
                                </div>
                             </div>
                             
                             <div className="mt-4 border-t border-zinc-100 pt-4 space-y-3">
                                <span className="text-[10px] font-black uppercase text-zinc-400">Variant Image</span>
                                <div className="flex items-center gap-3">
                                   <label className="flex-1 h-11 border-2 border-dashed border-zinc-200 hover:border-[#966FD6]/50 rounded-xl flex items-center justify-center cursor-pointer hover:bg-zinc-50 transition-colors gap-2 px-3">
                                      <ImageIcon className="h-4 w-4 text-zinc-400 shrink-0" />
                                      <span className="text-xs font-bold text-zinc-500 truncate max-w-[200px]">
                                         {v.image ? v.image.name : 'Upload Variant Image'}
                                      </span>
                                      <input 
                                         type="file" 
                                         className="hidden" 
                                         accept="image/*" 
                                         onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                               updateVariant(i, 'image', e.target.files[0]);
                                               updateVariant(i, 'image_url', undefined);
                                            }
                                         }} 
                                      />
                                   </label>
                                   {v.image ? (
                                      <div className="size-11 rounded-xl overflow-hidden border border-zinc-200 relative group shrink-0">
                                         <img src={URL.createObjectURL(v.image)} className="w-full h-full object-cover" alt="Variant preview" />
                                         <button 
                                            type="button" 
                                            onClick={() => {
                                               updateVariant(i, 'image', null);
                                               updateVariant(i, 'image_url', '');
                                            }}
                                            className="absolute inset-0 bg-black/55 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                         >
                                            <X className="size-3" />
                                         </button>
                                      </div>
                                   ) : v.image_url ? (
                                      <div className="size-11 rounded-xl overflow-hidden border border-zinc-200 relative group shrink-0">
                                         <img 
                                            src={v.image_url.startsWith('http') ? v.image_url : `http://localhost:8000${v.image_url}`} 
                                            className="w-full h-full object-cover" 
                                            alt="Variant image" 
                                         />
                                         <button 
                                            type="button" 
                                            onClick={() => {
                                               updateVariant(i, 'image_url', '');
                                               updateVariant(i, 'image', null);
                                            }}
                                            className="absolute inset-0 bg-black/55 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                         >
                                            <X className="size-3" />
                                         </button>
                                      </div>
                                   ) : null}
                                </div>
                             </div>

                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-100 pt-4">
                                    {!v.weight && (
                                      <>
                                        <div className="space-y-1">
                                           <span className="text-[10px] font-black uppercase text-zinc-400">Color Override</span>
                                           <Select 
                                             value={v.color_id || 'none'} 
                                             onValueChange={(val) => updateVariant(i, 'color_id', val === 'none' ? '' : val)}
                                           >
                                             <SelectTrigger className="h-10 rounded-xl border-zinc-200 bg-white text-xs">
                                               <SelectValue placeholder="Default" />
                                             </SelectTrigger>
                                             <SelectContent>
                                               <SelectItem value="none">Use Product Default</SelectItem>
                                               {colors.map((c) => (
                                                 <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                               ))}
                                             </SelectContent>
                                           </Select>
                                        </div>
                                        <div className="space-y-1">
                                           <span className="text-[10px] font-black uppercase text-zinc-400">Size Override</span>
                                           <Select 
                                             value={v.size_id || 'none'} 
                                             onValueChange={(val) => updateVariant(i, 'size_id', val === 'none' ? '' : val)}
                                           >
                                             <SelectTrigger className="h-10 rounded-xl border-zinc-200 bg-white text-xs">
                                               <SelectValue placeholder="Default" />
                                             </SelectTrigger>
                                             <SelectContent>
                                               <SelectItem value="none">Use Product Default</SelectItem>
                                               {sizes.map((s) => (
                                                 <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                               ))}
                                             </SelectContent>
                                           </Select>
                                        </div>
                                      </>
                                    )}
                                    {!v.color_id && !v.size_id && (
                                      <div className="space-y-1 col-span-1 sm:col-span-2">
                                         <span className="text-[10px] font-black uppercase text-zinc-400">Weight Override</span>
                                         <Input type="text" value={v.weight || ''} onChange={(e) => updateVariant(i, 'weight', e.target.value)} className="h-10 rounded-xl bg-white border-zinc-200 text-xs" placeholder="e.g. 5kg" />
                                      </div>
                                    )}
                                 </div>

                                 <div className="space-y-4 pt-4 border-t border-zinc-100">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Variant Discount (Overrides parent discount)</label>
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={v.discount !== null && v.discount !== undefined} onChange={(e) => {
                                           if (e.target.checked) {
                                              updateVariant(i, 'discount', { type: 'percent', value: 10, starts_at: new Date().toISOString().split('T')[0], ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_active: true });
                                           } else {
                                              updateVariant(i, 'discount', null);
                                           }
                                        }} className="accent-[#966FD6] h-4 w-4" />
                                        <span className="text-[10px] font-black uppercase text-[#966FD6]">Enable Variant Discount</span>
                                      </label>
                                    </div>
                                    {v.discount && (
                                      <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-50/50 rounded-2xl border border-[#966FD6]/20 animate-in fade-in duration-200">
                                         <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase text-zinc-400">Discount Type</span>
                                            <Select 
                                              value={v.discount.type} 
                                              onValueChange={(val: any) => updateVariant(i, 'discount', { ...v.discount!, type: val })}
                                            >
                                              <SelectTrigger className="h-10 rounded-xl border-zinc-200 bg-white text-xs">
                                                <SelectValue placeholder="Select type" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="percent">Percentage (%)</SelectItem>
                                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                                              </SelectContent>
                                            </Select>
                                         </div>
                                         <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase text-zinc-400">Discount Value</span>
                                            <Input type="number" value={v.discount.value} onChange={(e) => updateVariant(i, 'discount', { ...v.discount!, value: e.target.value === '' ? '' : Number(e.target.value) })} className="h-10 rounded-xl bg-white border-zinc-200 text-xs" />
                                         </div>
                                         <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase text-zinc-400">Starts At</span>
                                            <Input type="date" value={v.discount.starts_at} onChange={(e) => updateVariant(i, 'discount', { ...v.discount!, starts_at: e.target.value })} className="h-10 rounded-xl bg-white border-zinc-200 text-xs" />
                                         </div>
                                         <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase text-zinc-400">Ends At</span>
                                            <Input type="date" value={v.discount.ends_at} onChange={(e) => updateVariant(i, 'discount', { ...v.discount!, ends_at: e.target.value })} className="h-10 rounded-xl bg-white border-zinc-200 text-xs" />
                                         </div>
                                         <div className="col-span-2 flex items-center justify-end border-t border-zinc-100 pt-3">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                              <input type="checkbox" checked={v.discount.is_active} onChange={(e) => updateVariant(i, 'discount', { ...v.discount!, is_active: e.target.checked })} className="accent-[#966FD6] h-4 w-4" />
                                              <span className="text-[10px] font-black uppercase text-zinc-500">Discount Active</span>
                                            </label>
                                         </div>
                                      </div>
                                    )}
                                 </div>
                                 <div className="flex items-center justify-end border-t border-zinc-100 pt-4"><label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" checked={v.is_active} onChange={(e) => updateVariant(i, 'is_active', e.target.checked)} className="accent-[#966FD6] h-4 w-4" />
                                  <span className="text-[10px] font-black uppercase text-zinc-500">Variant Active</span>
                                </label>
                             </div>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between p-5 gap-4 border-t border-zinc-50 bg-white">
                 <p className="hidden md:block text-[10px] font-black uppercase tracking-widest text-[#966FD6] bg-[#966FD6]/5 px-4 py-2 rounded-full border border-[#966FD6]/10">
                   Ensure categories and variants are correctly defined
                 </p>
                 <div className="flex w-full sm:w-auto gap-3">
                    <Button type="button" variant="ghost" onClick={closeModal} className="flex-1 sm:flex-none font-bold text-zinc-400 rounded-xl md:rounded-2xl h-12 px-6 hover:bg-zinc-50">
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 sm:flex-none bg-[#966FD6] hover:bg-[#7d5bbf] text-white px-8 md:px-12 h-12 md:h-14 rounded-xl md:rounded-2xl font-black shadow-2xl shadow-[#966FD6]/30 active:scale-[0.98] transition-all"
                    >
                      {isSubmitting ? <Spinner size="sm" className="border-white mr-2" /> : null}
                      {formMode === 'create' ? 'Publish' : 'Save'}
                    </Button>
                 </div>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}