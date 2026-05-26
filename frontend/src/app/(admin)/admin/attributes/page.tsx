'use client';

import * as React from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Plus, Trash2, Edit2, Tag, Palette, Ruler, Check, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/src/lib/api';
import { getAuthToken } from '@/src/lib/auth';
import { Skeleton } from '@/src/components/ui/skeleton';
import { ConfirmDialog } from '@/src/components/modals/confirm-dialog';
import { Pagination } from '@/src/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { cn } from '@/src/lib/utils';

type Tab = 'brands' | 'colors' | 'sizes';

interface AttributeItem {
  id: string;
  name: string;
  slug?: string;
  hex_code?: string;
  long_description?: string;
}

const TABS: { key: Tab; label: string; icon: React.ElementType; accent: string; bg: string }[] = [
  { key: 'brands', label: 'Brands',  icon: Tag,     accent: '#966FD6', bg: '#966FD6/10' },
  { key: 'colors', label: 'Colors',  icon: Palette,  accent: '#E97B6A', bg: '#E97B6A/10' },
  { key: 'sizes',  label: 'Sizes',   icon: Ruler,    accent: '#4AABAB', bg: '#4AABAB/10' },
];

export default function AttributesPage() {
  const [activeTab, setActiveTab] = React.useState<Tab>('brands');
  const [items, setItems] = React.useState<AttributeItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 8;

  // Search state
  const [searchQuery, setSearchQuery] = React.useState('');

  // Form state
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [name, setName] = React.useState('');
  const [nameError, setNameError] = React.useState('');
  const [hexCode, setHexCode] = React.useState('#000000');
  const [longDescription, setLongDescription] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const activeConfig = TABS.find(t => t.key === activeTab)!;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchItems = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const endpoint =
        activeTab === 'brands' ? '/brands' :
        activeTab === 'colors' ? '/colors' :
        '/sizes';
      const res: any = await apiFetch(endpoint);
      setItems(res.data || []);
    } catch (e: any) {
      toast.error(e.message || `Failed to fetch ${activeTab}`);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  React.useEffect(() => {
    fetchItems();
    resetForm();
    setCurrentPage(1);
    setSearchQuery('');
  }, [activeTab, fetchItems]);

  // ── Form helpers ───────────────────────────────────────────────────────────
  const resetForm = () => {
    setEditingId(null);
    setName('');
    setNameError('');
    setHexCode('#000000');
    setLongDescription('');
  };

  const startEdit = (item: AttributeItem) => {
    setEditingId(item.id);
    setName(item.name);
    if (activeTab === 'colors') setHexCode(item.hex_code || '#000000');
    if (activeTab === 'brands') setLongDescription(item.long_description || '');
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Duplicate name check (case-insensitive, skip self when editing)
    const duplicate = items.find(
      item =>
        item.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        item.id !== editingId
    );
    if (duplicate) {
      setNameError(`A ${activeConfig.label.slice(0, -1).toLowerCase()} named "${name.trim()}" already exists.`);
      return;
    }
    setNameError('');

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const base =
        activeTab === 'brands' ? '/admin/brands' :
        activeTab === 'colors' ? '/admin/colors' :
        '/admin/sizes';
      const url    = editingId ? `${base}/${editingId}` : base;
      const method = editingId ? 'PUT' : 'POST';

      const payload: Record<string, string> = { name };
      if (activeTab === 'colors') payload.hex_code = hexCode;
      if (activeTab === 'brands') payload.long_description = longDescription;

      await apiFetch(url, {
        method,
        token: token || undefined,
        body: JSON.stringify(payload),
      });

      toast.success(editingId ? `${activeConfig.label.slice(0,-1)} updated` : `${activeConfig.label.slice(0,-1)} created`);
      resetForm();
      fetchItems();
    } catch (e: any) {
      toast.error(e.message || 'Error saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const token = getAuthToken();
      const base =
        activeTab === 'brands' ? '/admin/brands' :
        activeTab === 'colors' ? '/admin/colors' :
        '/admin/sizes';
      await apiFetch(`${base}/${deleteId}`, {
        method: 'DELETE',
        token: token || undefined,
      });
      toast.success(`${activeConfig.label.slice(0,-1)} deleted`);
      setDeleteId(null);
      fetchItems();
    } catch (e: any) {
      toast.error(e.message || 'Error deleting');
    }
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
  const filteredItems = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return items;
    return items.filter(item =>
      item.name.toLowerCase().includes(q) ||
      (item.slug && item.slug.toLowerCase().includes(q)) ||
      (item.hex_code && item.hex_code.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  // SN offset so numbering continues across pages
  const snOffset = (currentPage - 1) * ITEMS_PER_PAGE;

  return (
    <div className="p-6 font-lato space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-black text-black tracking-tight">Attributes</h1>
        <p className="text-sm text-zinc-400 font-medium mt-0.5">Manage your product brands, colors, and sizes in one place.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 bg-zinc-100 p-1.5 rounded-2xl w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={isActive ? { backgroundColor: tab.accent } : {}}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all duration-200',
                isActive
                  ? 'text-white shadow-md scale-[1.02]'
                  : 'text-zinc-500 hover:text-zinc-800 hover:bg-white/60'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Split panel */}
      <div className="flex gap-6 items-start">

        {/* ── LEFT PANEL (1/3): Form ── */}
        <div className="w-1/3 shrink-0">
          <div className="bg-white rounded-3xl border border-zinc-100 shadow-[0_4px_20px_rgb(0,0,0,0.04)] overflow-hidden">
            {/* Form header */}
            <div
              className="px-6 py-5 border-b border-zinc-50"
              style={{ backgroundColor: `${activeConfig.accent}0d` }}
            >
              <h2 className="text-base font-black text-black">
                {editingId ? `Edit ${activeConfig.label.slice(0,-1)}` : `Add ${activeConfig.label.slice(0,-1)}`}
              </h2>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                {editingId ? 'Update the details below.' : `Create a new ${activeConfig.label.toLowerCase().slice(0,-1)}.`}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  {activeConfig.label.slice(0,-1)} Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={name}
                  onChange={e => { setName(e.target.value); setNameError(''); }}
                  placeholder={
                    activeTab === 'brands' ? 'e.g. Nike' :
                    activeTab === 'colors' ? 'e.g. Crimson Red' :
                    'e.g. Large'
                  }
                  className={cn(
                    'h-11 rounded-xl font-bold focus-visible:ring-2',
                    nameError ? 'border-red-400 focus-visible:ring-red-300' : 'border-zinc-200'
                  )}
                  style={!nameError ? { '--tw-ring-color': activeConfig.accent } as any : {}}
                  required
                />
                {nameError && (
                  <p className="text-xs font-bold text-red-500 flex items-center gap-1.5 mt-1">
                    <X className="w-3 h-3 shrink-0" />
                    {nameError}
                  </p>
                )}
              </div>

              {/* Brands: long description field */}
              {activeTab === 'brands' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Long Description
                  </label>
                  <textarea
                    value={longDescription}
                    onChange={e => setLongDescription(e.target.value)}
                    placeholder="Describe the brand story, catalog, or warranty details..."
                    rows={4}
                    className="w-full rounded-xl border border-zinc-200 p-3 text-sm font-bold focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': activeConfig.accent } as any}
                  />
                </div>
              )}

              {/* Colors: hex picker */}
              {activeTab === 'colors' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Hex Color</label>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="color"
                        value={hexCode}
                        onChange={e => setHexCode(e.target.value)}
                        className="w-11 h-11 rounded-xl border border-zinc-200 cursor-pointer p-1"
                      />
                    </div>
                    <div className="flex-1 h-11 rounded-xl border border-zinc-200 flex items-center px-3">
                      <span className="font-black text-zinc-500 text-sm uppercase tracking-widest">{hexCode}</span>
                    </div>
                    <div
                      className="w-11 h-11 rounded-xl border border-zinc-100 shrink-0"
                      style={{ backgroundColor: hexCode }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="h-11 rounded-xl font-black w-full text-white shadow-md transition-all active:scale-[0.98]"
                  style={{ backgroundColor: activeConfig.accent }}
                >
                  {editingId
                    ? <><Check className="w-4 h-4 mr-2" /> Update</>
                    : <><Plus className="w-4 h-4 mr-2" /> Add {activeConfig.label.slice(0,-1)}</>
                  }
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={resetForm}
                    className="h-10 rounded-xl font-bold text-zinc-400 hover:text-zinc-700 w-full"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* ── RIGHT PANEL (2/3): Table ── */}
        <div className="flex-1 min-w-0 bg-white rounded-3xl border border-zinc-100 shadow-[0_4px_20px_rgb(0,0,0,0.04)] overflow-hidden">
          {/* Table header + search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 border-b border-zinc-50 bg-zinc-50/30">
            <h2 className="text-base font-black text-black shrink-0">
              {activeConfig.label} Registry
            </h2>
            <div className="flex-1 flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <Input
                  placeholder={`Search ${activeConfig.label.toLowerCase()}…`}
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-9 h-9 rounded-xl border-zinc-200 text-sm font-medium focus-visible:ring-1"
                  style={{ '--tw-ring-color': activeConfig.accent } as any}
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span className="text-xs font-bold text-zinc-400 shrink-0">
                {isLoading ? '—' : `${filteredItems.length} ${activeConfig.label.toLowerCase()}`}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50/50">
                <TableRow className="border-zinc-50 hover:bg-transparent">
                  <TableHead className="px-4 py-4 w-12 text-[10px] font-black uppercase tracking-widest text-zinc-400">SN</TableHead>
                  <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    {activeTab === 'colors' ? 'Color' : 'Name'}
                  </TableHead>
                  {activeTab === 'brands' && (
                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Slug</TableHead>
                  )}
                  {activeTab === 'colors' && (
                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Hex</TableHead>
                  )}
                  <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-zinc-50">
                      <TableCell className="px-4 py-4 w-12">
                        <Skeleton className="h-4 w-6" />
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                          <Skeleton className="h-4 w-28" />
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4"><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="px-6 py-16 text-center text-zinc-400 font-medium text-sm italic">
                      {searchQuery
                        ? `No ${activeConfig.label.toLowerCase()} match "${searchQuery}".`
                        : `No ${activeConfig.label.toLowerCase()} yet. Add one using the form.`}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((item, idx) => (
                    <TableRow
                      key={item.id}
                      className={cn(
                        'border-zinc-50 hover:bg-zinc-50/50 transition-colors',
                        editingId === item.id && 'bg-zinc-50'
                      )}
                    >
                      {/* SN cell */}
                      <TableCell className="px-4 py-4 w-12">
                        <span className="text-xs font-black text-zinc-300">
                          {String(snOffset + idx + 1).padStart(2, '0')}
                        </span>
                      </TableCell>

                      {/* Name cell */}
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {activeTab === 'colors' ? (
                            <div
                              className="w-8 h-8 rounded-lg border border-zinc-100 shrink-0"
                              style={{ backgroundColor: item.hex_code || '#ccc' }}
                            />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-black"
                              style={{ backgroundColor: `${activeConfig.accent}18`, color: activeConfig.accent }}
                            >
                              {item.name?.slice(0, 2)}
                            </div>
                          )}
                          <span className="font-bold text-sm text-black/90">{item.name}</span>
                        </div>
                      </TableCell>

                      {/* Second column */}
                      {activeTab === 'brands' && (
                        <TableCell className="px-6 py-4">
                          <code className="text-xs bg-zinc-100 px-2.5 py-1 rounded-full font-bold text-zinc-600">
                            {item.slug}
                          </code>
                        </TableCell>
                      )}
                      {activeTab === 'colors' && (
                        <TableCell className="px-6 py-4">
                          <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">{item.hex_code}</span>
                        </TableCell>
                      )}

                      {/* Actions */}
                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEdit(item)}
                            className="rounded-full text-zinc-400 hover:bg-zinc-100 transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(item.id)}
                            className="rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="border-t border-zinc-50">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={items.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={`Delete ${activeConfig.label.slice(0,-1)}`}
        description={`Are you sure you want to delete this ${activeConfig.label.toLowerCase().slice(0,-1)}? This action cannot be undone.`}
      />
    </div>
  );
}