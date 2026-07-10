'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  Users2,
  Tag,
  Loader2,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { Spinner } from '@/src/components/ui/spinner';
import { CouponFormModal } from '@/src/components/coupons/CouponFormModal';
import { RedemptionsModal } from '@/src/components/coupons/RedemptionsModal';
import {
  deleteCoupon,
  fetchCoupons,
  setCouponStatus,
} from '@/src/lib/coupons-api';
import type { Coupon } from '@/src/types/coupon';

export default function CouponsPage() {
  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingCoupon, setEditingCoupon] = React.useState<Coupon | null>(null);

  const [redemptionsOpen, setRedemptionsOpen] = React.useState(false);
  const [redemptionsCoupon, setRedemptionsCoupon] = React.useState<Coupon | null>(
    null
  );

  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCoupons();
      setCoupons(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = coupons.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.customer_code ?? '').toLowerCase().includes(q) ||
      (c.code ?? '').toLowerCase().includes(q)
    );
  });

  function openCreate() {
    setEditingCoupon(null);
    setFormOpen(true);
  }

  function openEdit(coupon: Coupon) {
    setEditingCoupon(coupon);
    setFormOpen(true);
  }

  function openRedemptions(coupon: Coupon) {
    setRedemptionsCoupon(coupon);
    setRedemptionsOpen(true);
  }

  async function handleToggleStatus(coupon: Coupon) {
    const nextStatus = coupon.status === 'active' ? 'inactive' : 'active';
    setTogglingId(coupon.id);
    try {
      await setCouponStatus(coupon.id, nextStatus);
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, status: nextStatus } : c))
      );
      toast.success('Coupon status updated successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update status');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(coupon: Coupon) {
    if (!confirm(`Delete coupon "${coupon.name}"? This cannot be undone.`)) {
      return;
    }
    setDeletingId(coupon.id);
    try {
      await deleteCoupon(coupon.id);
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
      toast.success('Coupon deleted successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete coupon');
    } finally {
      setDeletingId(null);
    }
  }

  function summarizeDiscount(coupon: Coupon) {
    const rule = coupon.region_rules?.[0];
    if (!rule) return '—';
    const value =
      rule.discount_type === 'percentage'
        ? `${rule.discount_value}%`
        : `${rule.currency} ${rule.discount_value}`;
    const extra = coupon.region_rules.length > 1 ? ` +${coupon.region_rules.length - 1} more` : '';
    return `${value}${extra}`;
  }

  return (
    <div className="p-6 lg:p-8 font-lato">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-black tracking-tight">
            Coupons
          </h1>
          <p className="text-sm text-zinc-400">
            Manage discount codes, usage limits, and targeting.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#966FD6] hover:bg-[#7d54c2] text-white font-bold gap-2"
        >
          <Plus className="size-4" />
          New coupon
        </Button>
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or code…"
          className="w-full sm:w-80 rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#966FD6] focus:ring-2 focus:ring-[#966FD6]/20"
        />
      </div>

      <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="sm" className="size-6 border-zinc-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Tag className="size-8 text-zinc-200 mb-3" />
            <p className="text-sm font-bold text-zinc-500">No coupons found</p>
            <p className="text-xs text-zinc-400 mt-1">
              {search ? 'Try a different search.' : 'Create your first coupon to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs font-bold text-zinc-400 uppercase tracking-wide">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Discount</th>
                  <th className="px-5 py-3">Usage</th>
                  <th className="px-5 py-3">Expires</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((coupon) => (
                  <tr
                    key={coupon.id}
                    className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60"
                  >
                    <td className="px-5 py-3.5 font-bold text-black">
                      {coupon.name}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500">
                      <code className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold">
                        {coupon.customer_code || coupon.code || '—'}
                      </code>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600">
                      {summarizeDiscount(coupon)}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500">
                      {coupon.used_count ?? 0}
                      {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500">
                      {coupon.expires_at
                        ? new Date(coupon.expires_at).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggleStatus(coupon)}
                        disabled={togglingId === coupon.id}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition disabled:opacity-50',
                          coupon.status === 'active'
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                        )}
                      >
                        {togglingId === coupon.id && (
                          <Loader2 className="size-3 animate-spin" />
                        )}
                        {coupon.status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openRedemptions(coupon)}
                          title="View redemptions"
                          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-black"
                        >
                          <Users2 className="size-4" />
                        </button>
                        <button
                          onClick={() => openEdit(coupon)}
                          title="Edit"
                          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-black"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon)}
                          disabled={deletingId === coupon.id}
                          title="Delete"
                          className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          {deletingId === coupon.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CouponFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        coupon={editingCoupon}
      />

      <RedemptionsModal
        open={redemptionsOpen}
        onClose={() => setRedemptionsOpen(false)}
        coupon={redemptionsCoupon}
      />
    </div>
  );
}