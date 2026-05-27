'use client';

import * as React from 'react';
import { apiFetch } from '@/src/lib/api';
import { getAuthToken } from '@/src/lib/auth';
import { Category } from '@/src/types';
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
  TableRow 
} from '@/src/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/src/components/ui/select';
import { Edit2, Trash2, Plus, X, Image as ImageIcon, Layers, Search, Calendar, FilterX, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';
import { DatePicker } from '@/src/components/ui/date-picker';
import { Pagination } from '@/src/components/ui/pagination';
import { format, isSameDay, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

export default function CategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Filter State
  const [searchQuery, setSearchQuery] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>();
  const [dateTo, setDateTo] = React.useState<Date | undefined>();
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  
  // Form State
  const [formMode, setFormMode] = React.useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = React.useState<string | number | null>(null);
  const [formData, setFormData] = React.useState({ 
    name: '', 
    slug: '', 
    parent_id: '', 
    description: '',
    is_active: true,
    existingImage: ''
  });
  const [removeExistingImage, setRemoveExistingImage] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const token = getAuthToken();

  const loadCategories = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const freshToken = getAuthToken();
      const res = await apiFetch<any>(`/categories?include_inactive=1&status=all&page=${page}&per_page=10`, { token: freshToken || undefined });
      let categoriesData: Category[] = [];
      let total = 0;
      let lastPage = 1;

      if (Array.isArray(res)) {
          categoriesData = res;
          total = res.length;
      } else {
          const resData = res?.data?.data || res?.data || [];
          categoriesData = Array.isArray(resData) ? resData : [];
          total = res?.total || res?.meta?.total || categoriesData.length;
          lastPage = res?.last_page || res?.meta?.last_page || 1;
      }
                                                
      setCategories(categoriesData);
      setTotalItems(total);
      setTotalPages(lastPage);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCategories();
  }, [loadCategories, page]);

  const openModal = (mode: 'create' | 'edit', category?: Category) => {
    setFormMode(mode);
    if (mode === 'edit' && category) {
      setEditingId(category.id);
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        parent_id: category.parent_id?.toString() || '',
        description: category.description || '',
        is_active: category.is_active ?? true,
        existingImage: category.image_url || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        slug: '',
        parent_id: '',
        description: '',
        is_active: true,
        existingImage: '',
      });
    }
    setSelectedImage(null);
    setRemoveExistingImage(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', slug: '', parent_id: '', description: '', is_active: true, existingImage: '' });
    setSelectedImage(null);
    setRemoveExistingImage(false);
    setEditingId(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      // Get fresh token at submit time
      const freshToken = getAuthToken();
      
      const body = new FormData();
      body.append('name', formData.name);
      if (formData.slug) body.append('slug', formData.slug);
      if (formData.parent_id && formData.parent_id !== 'none') {
        body.append('parent_id', formData.parent_id);
      }
      if (formData.description) body.append('description', formData.description);
      body.append('is_active', formData.is_active ? '1' : '0');
      
      if (selectedImage) {
        body.append('image', selectedImage);
      } else if (removeExistingImage) {
        body.append('remove_image', '1');
      }

      if (formMode === 'create') {
        await apiFetch('/admin/categories', {
          method: 'POST',
          token: freshToken || undefined,
          body: body, 
        });
        toast.success('Category created successfully');
      } else if (formMode === 'edit' && editingId) {
        // Use method spoofing (POST + _method=PUT) which is the most reliable way 
        // to handle multipart/form-data updates in many backends
        body.append('_method', 'PUT');
        await apiFetch(`/admin/categories/${editingId}`, {
          method: 'POST',
          token: freshToken || undefined,
          body: body,
        });
        toast.success('Category updated successfully');
      }
      closeModal();
      loadCategories();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await apiFetch(`/admin/categories/${id}`, {
        method: 'DELETE',
        token: token || undefined,
      });
      toast.success('Category deleted successfully');
      loadCategories();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete category');
    }
  };

  const filteredCategories = React.useMemo(() => {
    return categories.filter(cat => {
      const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          cat.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      let matchesDate = true;
      if (cat.created_at) {
        const catDate = new Date(cat.created_at);
        if (dateFrom && dateTo) {
          matchesDate = isWithinInterval(catDate, { 
            start: startOfDay(dateFrom), 
            end: endOfDay(dateTo) 
          });
        } else if (dateFrom) {
          matchesDate = catDate >= startOfDay(dateFrom);
        } else if (dateTo) {
          matchesDate = catDate <= endOfDay(dateTo);
        }
      } else if (dateFrom || dateTo) {
        matchesDate = false;
      }
      
      return matchesSearch && matchesDate;
    });
  }, [categories, searchQuery, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchQuery('');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <div className="space-y-8 font-lato">
      <PageHeader 
        title="Category Management" 
        description="Organize your products by creating and managing hierarchical categories."
      >
        <Button 
          onClick={() => openModal('create')} 
          className="h-11 px-6 rounded-xl bg-[#966FD6] hover:bg-[#7d5bbf] text-white transition-all shadow-md active:scale-[0.98]"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
        <div className="relative flex-1 max-w-sm min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <Input 
            placeholder="Search categories..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 rounded-xl focus-visible:ring-[#966FD6] border-zinc-200 font-medium"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
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
          
          {(searchQuery || dateFrom || dateTo) && (
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
          <h2 className="text-lg font-black text-black">Category Registry</h2>
          <div className="flex items-center gap-4">
             <span className="text-xs font-bold text-zinc-400">
               {totalItems} Categories Total
             </span>
          </div>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="hover:bg-transparent border-zinc-100">
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest">Category</TableHead>
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest">Slug</TableHead>
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest">Parent</TableHead>
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest">Date</TableHead>
                {/*<TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest text-center">Status</TableHead>*/}
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-zinc-50">
                    <TableCell className="py-5 px-6">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    {/*<TableCell className="py-5 px-6 text-center">
                      <div className="flex justify-center">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                    </TableCell>*/}
                    <TableCell className="py-5 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center p-20 text-zinc-500 font-medium italic">
                    {searchQuery || dateFrom || dateTo ? "No categories match your current filters." : "No categories found. Click \"Add Category\" to create your first one."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((cat) => (
                  <TableRow key={cat.id} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                    <TableCell className="py-5 px-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-[#966FD6]/10 flex items-center justify-center text-[#966FD6] shrink-0 overflow-hidden">
                          {cat.image_url ? (
                            <img 
                              src={cat.image_url.startsWith('http') ? cat.image_url : `http://localhost:8000${cat.image_url}`} 
                              alt={cat.name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <Layers className="size-6" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-black/90 text-base">{cat.name}</p>
                          <p className="text-zinc-400 text-xs font-medium line-clamp-1">{cat.description || 'No description'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <code className="text-xs bg-zinc-100 px-2.5 py-1 rounded-full font-bold text-zinc-600">
                        /{cat.slug}
                      </code>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <span className="text-sm font-bold text-zinc-500">
                        {cat.parent_name || (cat.parent_id ? categories.find(c => c.id.toString() === cat.parent_id?.toString())?.name : null) || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <div className="text-xs font-bold text-zinc-400">
                        {cat.created_at ? new Date(cat.created_at).toLocaleDateString() : '—'}
                      </div>
                    </TableCell>
                    {/*<TableCell className="py-5 px-6 text-center">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        cat.is_active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                      )}>
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>*/}
                    <TableCell className="py-5 px-6 text-right space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openModal('edit', cat)}
                        className="rounded-full text-zinc-400 hover:text-[#966FD6] hover:bg-[#966FD6]/5 transition-all"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(cat.id)}
                        className="rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all"
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

        {!isLoading && totalPages > 1 && (
          <div className="border-t border-zinc-100 bg-zinc-50/30">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={totalItems}
              itemsPerPage={10}
            />
          </div>
        )}
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-zinc-50 bg-zinc-50/30">
              <div>
                <h2 className="text-2xl font-black text-black tracking-tight">
                  {formMode === 'create' ? 'Create New Category' : 'Edit Category'}
                </h2>
                <p className="text-zinc-500 text-sm font-medium mt-1">
                  {formMode === 'create' ? 'Define a new branch for your product catalog.' : 'Update the category details and metadata.'}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeModal} className="rounded-full bg-white shadow-sm border border-zinc-100">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Category Name <span className="text-red-500">*</span></label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData({ 
                        ...formData, 
                        name,
                        slug: slugify(name)
                      });
                    }}
                    placeholder="e.g. Electronics"
                    className="h-12 rounded-xl focus-visible:ring-[#966FD6] border-zinc-200 font-bold"
                    autoFocus
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">URL Slug <span className="text-red-500">*</span></label>
                  <Input 
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="electronics-and-gadgets"
                    className="h-12 rounded-xl focus-visible:ring-[#966FD6] border-zinc-200 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Parent Category</label>
                <Select 
                  value={formData.parent_id} 
                  onValueChange={(val) => setFormData({ ...formData, parent_id: val })}
                >
                  <SelectTrigger className="h-12 rounded-xl border-zinc-200 font-bold">
                    <SelectValue placeholder="Select a parent category (optional)" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">None (Root Category)</SelectItem>
                    {categories
                      .filter(c => c.id.toString() !== editingId?.toString())
                      .map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="A brief description of this category..."
                  className="w-full min-h-[100px] p-4 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#966FD6]/20 transition-all font-medium text-sm resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Category Image</label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex flex-col items-center justify-center h-24 border-2 border-dashed border-zinc-200 rounded-2xl hover:bg-zinc-50 hover:border-[#966FD6]/30 cursor-pointer transition-all">
                    <ImageIcon className="size-6 text-zinc-300 mb-1" />
                    <span className="text-xs font-bold text-zinc-400">{selectedImage ? selectedImage.name : 'Choose Image'}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                  {selectedImage ? (
                    <div className="h-24 w-24 rounded-2xl border border-zinc-100 overflow-hidden bg-zinc-50 flex items-center justify-center relative group">
                      <img src={URL.createObjectURL(selectedImage)} className="w-full h-full object-cover" alt="New" />
                      <button 
                        type="button"
                        onClick={() => setSelectedImage(null)}
                        className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <Trash2 className="size-5" />
                      </button>
                    </div>
                  ) : formData.existingImage && !removeExistingImage ? (
                    <div className="h-24 w-24 rounded-2xl border border-zinc-100 overflow-hidden bg-zinc-50 relative shrink-0 group">
                      <img 
                        src={formData.existingImage.startsWith('http') ? formData.existingImage : `http://localhost:8000${formData.existingImage}`} 
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

              <div className="flex flex-col sm:flex-row justify-end gap-3 p-5 border-t border-zinc-50 bg-white">
                <Button type="button" variant="ghost" onClick={closeModal} disabled={isSubmitting} className="font-bold rounded-xl text-zinc-500 h-12 w-full sm:w-auto">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !formData.name.trim()}
                  className="bg-[#966FD6] hover:bg-[#7d5bbf] text-white px-10 h-12 rounded-xl font-black shadow-lg shadow-[#966FD6]/20 active:scale-[0.98] w-full sm:w-auto"
                >
                  {isSubmitting ? <Spinner size="sm" className="border-white mr-2" /> : null}
                  {formMode === 'create' ? 'Create' : 'Save'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}