'use client';

import * as React from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/src/lib/api';
import { getAuthToken } from '@/src/lib/auth';
import { Skeleton } from '@/src/components/ui/skeleton';
import { ConfirmDialog } from '@/src/components/modals/confirm-dialog';

export default function SizesPage() {
  const [sizes, setSizes] = React.useState<any[]>([]);
  const [name, setName] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const fetchSizes = async () => {
    setIsLoading(true);
    try {
      const res: any = await apiFetch('/sizes');
      setSizes(res.data || []);
    } catch (e: any) {
      toast.error(e.message || 'Failed to fetch sizes');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSizes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const token = getAuthToken();
      const url = editingId ? `/admin/sizes/${editingId}` : '/admin/sizes';
      const method = editingId ? 'PUT' : 'POST';

      await apiFetch(url, {
        method,
        token: token || undefined,
        body: JSON.stringify({ name }),
      });

      toast.success(editingId ? 'Size updated' : 'Size created');
      setName('');
      setEditingId(null);
      fetchSizes();
    } catch (e: any) {
      toast.error(e.message || 'Error saving size');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const token = getAuthToken();
      await apiFetch(`/admin/sizes/${deleteId}`, {
        method: 'DELETE',
        token: token || undefined,
      });
      toast.success('Size deleted');
      setDeleteId(null);
      fetchSizes();
    } catch (e: any) {
      toast.error(e.message || 'Error deleting size');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sizes</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-4 mb-8 p-4 bg-white rounded-lg shadow-sm">
        <Input
          placeholder="Size (e.g. XL, 42, Large)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit">
          {editingId ? <Edit className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {editingId ? 'Update Size' : 'Add Size'}
        </Button>
        {editingId && (
          <Button type="button" variant="ghost" onClick={() => { setEditingId(null); setName(''); }}>
            Cancel
          </Button>
        )}
      </form>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium text-gray-600">Size Name</th>
              <th className="p-4 font-medium text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sizes.map((s) => (
              <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50/50">
                <td className="p-4">{s.name}</td>
                <td className="p-4 flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => { setEditingId(s.id); setName(s.name); }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleteId(s.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {!isLoading && sizes.length === 0 && (
              <tr>
                <td colSpan={2} className="p-8 text-center text-gray-500">No sizes found.</td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                <td className="p-4 flex gap-2 justify-end">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Size"
        description="Are you sure you want to delete this size? This action cannot be undone."
      />
    </div>
  );
}
