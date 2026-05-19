'use client';

import * as React from 'react';
import { apiFetch } from '@/src/lib/api';
import { getAuthToken } from '@/src/lib/auth';
import { Category } from '@/src/types';
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
import { Edit2, Trash2, Plus, X, Image as ImageIcon, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';

export default function CategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  
  // Form State
  const [formMode, setFormMode] = React.useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = React.useState<string | number | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    slug: '',
    parent_id: '',
    description: '',
  });
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const token = getAuthToken();

  const loadCategories = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch<any>('/categories');
      const categoriesData = res.data || (Array.isArray(res) ? res : []);
      setCategories(categoriesData);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const openModal = (mode: 'create' | 'edit', category?: Category) => {
    setFormMode(mode);
    if (mode === 'edit' && category) {
      setEditingId(category.id);
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        parent_id: category.parent_id?.toString() || '',
        description: category.description || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        slug: '',
        parent_id: '',
        description: '',
      });
    }
    setSelectedImage(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', slug: '', parent_id: '', description: '' });
    setSelectedImage(null);
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
      const body = new FormData();
      body.append('name', formData.name);
      if (formData.slug) body.append('slug', formData.slug);
      if (formData.parent_id && formData.parent_id !== 'none') {
        body.append('parent_id', formData.parent_id);
      }
      if (formData.description) body.append('description', formData.description);
      if (selectedImage) body.append('image', selectedImage);

      if (formMode === 'create') {
        await apiFetch('/admin/categories', {
          method: 'POST',
          token: token || undefined,
          body: body, 
        });
        toast.success('Category created successfully');
      } else if (formMode === 'edit' && editingId) {
        body.append('_method', 'PUT');
        await apiFetch(`/admin/categories/${editingId}`, {
          method: 'POST',
          token: token || undefined,
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

      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-20"><Spinner size="lg" className="border-[#966FD6]" /></div>
        ) : categories.length === 0 ? (
          <div className="text-center p-20 text-zinc-500 font-medium">
            No categories found. Click "Add Category" to create your first one.
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="hover:bg-transparent border-zinc-100">
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest">Category</TableHead>
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest">Slug</TableHead>
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest">Parent</TableHead>
                <TableHead className="py-5 px-6 font-black text-black text-xs uppercase tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                  <TableCell className="py-5 px-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-[#966FD6]/10 flex items-center justify-center text-[#966FD6] shrink-0 overflow-hidden">
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
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
                      {cat.parent_name || '—'}
                    </span>
                  </TableCell>
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
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-8 border-b border-zinc-50 bg-zinc-50/30">
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
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Category Name</label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Electronics"
                    className="h-12 rounded-xl focus-visible:ring-[#966FD6] border-zinc-200 font-bold"
                    autoFocus
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">URL Slug</label>
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
                  {selectedImage && (
                    <div className="h-24 w-24 rounded-2xl border border-zinc-100 overflow-hidden bg-zinc-50 flex items-center justify-center relative group">
                      <img src={URL.createObjectURL(selectedImage)} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setSelectedImage(null)}
                        className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <Trash2 className="size-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={closeModal} disabled={isSubmitting} className="font-bold rounded-xl text-zinc-500">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !formData.name.trim()}
                  className="bg-[#966FD6] hover:bg-[#7d5bbf] text-white px-10 h-12 rounded-xl font-black shadow-lg shadow-[#966FD6]/20 active:scale-[0.98]"
                >
                  {isSubmitting ? <Spinner size="sm" className="border-white mr-2" /> : null}
                  {formMode === 'create' ? 'Create Category' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
