'use client';

import * as React from 'react';
import { apiFetch } from '@/src/lib/api';
import { getAuthToken } from '@/src/lib/auth';
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
import { Edit2, Trash2, Plus, X, Search, Tag as TagIcon, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';

interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

const emptyForm = {
  name: '',
  slug: '',
};

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

export default function AdminTagsPage() {
  const [tags, setTags] = React.useState<Tag[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);

  // Form State
  const [formMode, setFormMode] = React.useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({ ...emptyForm });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch<any>(`/tags?page=${page}&per_page=10&search=${searchQuery}`);
      if (res?.data && Array.isArray(res.data)) {
        setTags(res.data);
        setTotalPages(res.last_page || 1);
        setTotalItems(res.total || res.data.length);
      } else {
        setTags(res?.data || []);
        setTotalPages(1);
        setTotalItems(res?.data?.length || 0);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load tags');
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtering is now handled on the server via searchQuery in loadData
  // const filteredTags = tags.filter((tag) => ...);

  const openModal = (mode: 'create' | 'edit', tag?: Tag) => {
    setFormMode(mode);
    if (mode === 'edit' && tag) {
      setEditingId(tag.id);
      setFormData({ name: tag.name, slug: tag.slug });
    } else {
      setEditingId(null);
      setFormData({ ...emptyForm });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ ...emptyForm });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      if (formMode === 'create') {
        await apiFetch('/admin/tags', {
          method: 'POST',
          token: token || undefined,
          body: JSON.stringify(formData),
          headers: { 'Content-Type': 'application/json' }
        });
        toast.success('Tag created successfully');
      } else {
        await apiFetch(`/admin/tags/${editingId}`, {
          method: 'PUT',
          token: token || undefined,
          body: JSON.stringify(formData),
          headers: { 'Content-Type': 'application/json' }
        });
        toast.success('Tag updated successfully');
      }
      closeModal();
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    try {
      const token = getAuthToken();
      await apiFetch(`/admin/tags/${id}`, {
        method: 'DELETE',
        token: token || undefined
      });
      toast.success('Tag deleted');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-8 font-lato p-6 max-w-4xl mx-auto">
      <PageHeader title="Tag Management" description="Manage product labels and filtering tags.">
        <Button
          onClick={() => openModal('create')}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-11 px-6 shadow-lg shadow-purple-600/20"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Tag
        </Button>
      </PageHeader>

      <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm relative">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
        <Input 
          placeholder="Search tags..." 
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1); // Reset to page 1 on search
          }}
          className="pl-11 h-12 rounded-xl focus-visible:ring-purple-600 border-zinc-200"
        />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50">
            <TableRow>
              <TableHead className="font-bold text-black uppercase text-[10px] tracking-widest px-6 py-4 w-[80px]">S.N.</TableHead>
              <TableHead className="font-bold text-black uppercase text-[10px] tracking-widest px-6 py-4">Tag Name</TableHead>
              <TableHead className="font-bold text-black uppercase text-[10px] tracking-widest px-6 py-4">Slug</TableHead>
              <TableHead className="font-bold text-black uppercase text-[10px] tracking-widest px-6 py-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-6 py-4"><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell className="px-6 py-4"><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell className="px-6 py-4"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="px-6 py-4 text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center p-12 text-zinc-500 italic">No tags found.</TableCell>
              </TableRow>
            ) : (
              tags.map((tag, index) => (
                <TableRow key={tag.id} className="hover:bg-zinc-50/50">
                  <TableCell className="px-6 py-4 font-medium text-zinc-500">
                    {(page - 1) * 10 + index + 1}
                  </TableCell>
                  <TableCell className="px-6 py-4 font-bold text-zinc-800">
                    <div className="flex items-center gap-2">
                       <TagIcon className="size-4 text-purple-600/50" />
                       {tag.name}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-zinc-500 font-mono">{tag.slug}</TableCell>
                  <TableCell className="px-6 py-4 text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openModal('edit', tag)} className="rounded-full hover:text-purple-600">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(tag.id)} className="rounded-full hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 bg-zinc-50 border-t border-zinc-100">
            <p className="text-xs font-black uppercase text-zinc-400 tracking-widest">
              Showing page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="rounded-xl h-9 px-4 border-zinc-200"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-xl h-9 px-4 border-zinc-200"
              >
                Next <ChevronLeft className="h-4 w-4 ml-1 rotate-180" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                <h2 className="text-xl font-black">{formMode === 'create' ? 'Create New Tag' : 'Edit Tag'}</h2>
                <Button variant="ghost" size="icon" onClick={closeModal} className="rounded-full"><X className="size-5" /></Button>
             </div>
             <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tag Name</label>
                   <Input 
                     autoFocus
                     value={formData.name} 
                     onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: slugify(e.target.value) })} 
                     placeholder="e.g. Organic" 
                     required 
                     className="h-12 rounded-xl"
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Slug</label>
                   <Input 
                     value={formData.slug} 
                     onChange={(e) => setFormData({ ...formData, slug: e.target.value })} 
                     placeholder="organic" 
                     required 
                     className="h-12 rounded-xl bg-zinc-50"
                   />
                </div>
                <div className="flex gap-3 pt-4">
                   <Button type="button" variant="ghost" onClick={closeModal} className="flex-1 rounded-xl h-12">Cancel</Button>
                   <Button type="submit" disabled={isSubmitting} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-12 font-black">
                      {isSubmitting ? <Spinner size="sm" className="mr-2" /> : (formMode === 'create' ? 'Create' : 'Save')}
                   </Button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
