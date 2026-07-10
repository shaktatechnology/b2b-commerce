'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { X, Wand2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { Spinner } from '@/src/components/ui/spinner';
import { RegionRuleBuilder } from './RegionRuleBuilder';
import { RelationPicker } from './RelationPicker';
import {
  createCoupon,
  generateCouponCode,
  getBrandOptions,
  getCategoryOptions,
  getProductOptions,
  getUserOptions,
  updateCoupon,
} from '@/src/lib/coupons-api';
import type { Coupon, CouponPayload, CouponRegionRule } from '@/src/types/coupon';

interface CouponFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  coupon?: Coupon | null; // null/undefined = create mode
}

const defaultRegionRule: CouponRegionRule = {
  market: 'NP',
  currency: 'NPR',
  discount_type: 'percentage',
  discount_value: 10,
  minimum_subtotal: null,
  maximum_discount: null,
  free_shipping: false,
};

function toDatetimeLocal(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function CouponFormModal({
  open,
  onClose,
  onSaved,
  coupon,
}: CouponFormModalProps) {
  const isEdit = !!coupon;
  const [saving, setSaving] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);

  const [form, setForm] = React.useState<CouponPayload>({
    name: '',
    customer_code: '',
    description: '',
    status: 'active',
    starts_at: null,
    expires_at: null,
    usage_limit: null,
    usage_per_user: null,
    stackable: false,
    first_order_only: false,
    customer_type: '',
    product_ids: [],
    category_ids: [],
    brand_ids: [],
    user_ids: [],
    region_rules: [{ ...defaultRegionRule }],
  });

  React.useEffect(() => {
    if (!open) return;
    if (coupon) {
      setForm({
        name: coupon.name ?? '',
        customer_code: coupon.customer_code ?? '',
        description: coupon.description ?? '',
        status: coupon.status ?? 'active',
        starts_at: coupon.starts_at ?? null,
        expires_at: coupon.expires_at ?? null,
        usage_limit: coupon.usage_limit ?? null,
        usage_per_user: coupon.usage_per_user ?? null,
        stackable: !!coupon.stackable,
        first_order_only: !!coupon.first_order_only,
        customer_type: coupon.customer_type ?? '',
        product_ids: coupon.product_ids ?? [],
        category_ids: coupon.category_ids ?? [],
        brand_ids: coupon.brand_ids ?? [],
        user_ids: coupon.user_ids ?? [],
        region_rules:
          coupon.region_rules && coupon.region_rules.length > 0
            ? coupon.region_rules
            : [{ ...defaultRegionRule }],
      });
    } else {
      setForm({
        name: '',
        customer_code: '',
        description: '',
        status: 'active',
        starts_at: null,
        expires_at: null,
        usage_limit: null,
        usage_per_user: null,
        stackable: false,
        first_order_only: false,
        customer_type: '',
        product_ids: [],
        category_ids: [],
        brand_ids: [],
        user_ids: [],
        region_rules: [{ ...defaultRegionRule }],
      });
    }
  }, [open, coupon]);

  if (!open) return null;

  async function handleGenerateCode() {
    setGenerating(true);
    try {
      const code = await generateCouponCode(8);
      setForm((f) => ({ ...f, customer_code: code }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not generate code');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!form.region_rules.length) {
      toast.error('At least one region rule is required');
      return;
    }

    const payload: CouponPayload = {
      ...form,
      customer_code: form.customer_code?.trim() || null,
      description: form.description?.trim() || null,
      customer_type: form.customer_type?.trim() || null,
      starts_at: form.starts_at || null,
      expires_at: form.expires_at || null,
      product_ids: form.product_ids?.length ? form.product_ids : null,
      category_ids: form.category_ids?.length ? form.category_ids : null,
      brand_ids: form.brand_ids?.length ? form.brand_ids : null,
      user_ids: form.user_ids?.length ? form.user_ids : null,
    };

    setSaving(true);
    try {
      if (isEdit && coupon) {
        await updateCoupon(coupon.id, payload);
        toast.success('Coupon updated successfully');
      } else {
        const { secure_code } = await createCoupon(payload);
        toast.success('Coupon created successfully', {
          description: secure_code ? `Code: ${secure_code}` : undefined,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl font-lato">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-white rounded-t-2xl">
          <h2 className="text-lg font-black text-black">
            {isEdit ? 'Edit Coupon' : 'Create Coupon'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-black"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Basics */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-zinc-600 mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                maxLength={150}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#966FD6] focus:ring-2 focus:ring-[#966FD6]/20"
                placeholder="e.g. Summer Sale 15%"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-zinc-600 mb-1.5">
                Customer code
              </label>
              <div className="flex gap-2">
                <input
                  value={form.customer_code ?? ''}
                  maxLength={10}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customer_code: e.target.value }))
                  }
                  className="flex-1 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#966FD6] focus:ring-2 focus:ring-[#966FD6]/20"
                  placeholder="SAVE15"
                />
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  disabled={generating}
                  title="Generate code"
                  className="flex items-center justify-center rounded-xl border border-zinc-200 px-3 hover:bg-zinc-50 disabled:opacity-50"
                >
                  {generating ? (
                    <Spinner size="sm" className="size-4 border-zinc-400" />
                  ) : (
                    <Wand2 className="size-4 text-zinc-500" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-zinc-600 mb-1.5">
                Status
              </label>
              <select
                value={form.status ?? 'active'}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as 'active' | 'inactive',
                  }))
                }
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#966FD6]"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-zinc-600 mb-1.5">
                Description
              </label>
              <textarea
                value={form.description ?? ''}
                maxLength={5000}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#966FD6] focus:ring-2 focus:ring-[#966FD6]/20"
                placeholder="Internal notes about this coupon…"
              />
            </div>
          </div>

          {/* Schedule + limits */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-zinc-600 mb-1.5">
                Starts at
              </label>
              <input
                type="datetime-local"
                value={toDatetimeLocal(form.starts_at)}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    starts_at: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  }))
                }
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#966FD6]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-600 mb-1.5">
                Expires at
              </label>
              <input
                type="datetime-local"
                value={toDatetimeLocal(form.expires_at)}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    expires_at: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  }))
                }
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#966FD6]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-zinc-600 mb-1.5">
                Usage limit (total)
              </label>
              <input
                type="number"
                min={1}
                value={form.usage_limit ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    usage_limit: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                placeholder="Unlimited"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#966FD6]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-600 mb-1.5">
                Usage limit (per user)
              </label>
              <input
                type="number"
                min={1}
                value={form.usage_per_user ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    usage_per_user: e.target.value
                      ? Number(e.target.value)
                      : null,
                  }))
                }
                placeholder="Unlimited"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#966FD6]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-zinc-600 mb-1.5">
                Customer type
              </label>
              <input
                value={form.customer_type ?? ''}
                maxLength={32}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customer_type: e.target.value }))
                }
                placeholder="e.g. new, wholesale"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#966FD6]"
              />
            </div>

            <div className="flex items-end gap-5 pb-1">
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-600">
                <input
                  type="checkbox"
                  checked={!!form.stackable}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, stackable: e.target.checked }))
                  }
                  className="size-4 rounded accent-[#966FD6]"
                />
                Stackable
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-600">
                <input
                  type="checkbox"
                  checked={!!form.first_order_only}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      first_order_only: e.target.checked,
                    }))
                  }
                  className="size-4 rounded accent-[#966FD6]"
                />
                First order only
              </label>
            </div>
          </div>

          {/* Region rules */}
          <RegionRuleBuilder
            value={form.region_rules}
            onChange={(region_rules) => setForm((f) => ({ ...f, region_rules }))}
          />

          {/* Targeting */}
          <div className="space-y-4 pt-1">
            <p className="text-sm font-bold text-zinc-600">
              Targeting{' '}
              <span className="font-normal text-zinc-400">
                (leave empty to apply to everything)
              </span>
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <RelationPicker
                label="Products"
                placeholder="Search products…"
                value={form.product_ids ?? []}
                onChange={(product_ids) =>
                  setForm((f) => ({ ...f, product_ids }))
                }
                fetchOptions={getProductOptions}
              />
              <RelationPicker
                label="Categories"
                placeholder="Search categories…"
                value={form.category_ids ?? []}
                onChange={(category_ids) =>
                  setForm((f) => ({ ...f, category_ids }))
                }
                fetchOptions={getCategoryOptions}
              />
              <RelationPicker
                label="Brands"
                placeholder="Search brands…"
                value={form.brand_ids ?? []}
                onChange={(brand_ids) => setForm((f) => ({ ...f, brand_ids }))}
                fetchOptions={getBrandOptions}
              />
              <RelationPicker
                label="Users"
                placeholder="Search users…"
                value={form.user_ids ?? []}
                onChange={(user_ids) => setForm((f) => ({ ...f, user_ids }))}
                fetchOptions={getUserOptions}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className={cn(
                'bg-[#966FD6] hover:bg-[#7d54c2] text-white font-bold px-6'
              )}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" className="size-4 border-white" />
                  Saving…
                </span>
              ) : isEdit ? (
                'Save changes'
              ) : (
                'Create coupon'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}