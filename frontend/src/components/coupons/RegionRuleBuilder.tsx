'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { CouponRegionRule } from '@/src/types/coupon';

interface RegionRuleBuilderProps {
  value: CouponRegionRule[];
  onChange: (rules: CouponRegionRule[]) => void;
}

const emptyRule: CouponRegionRule = {
  market: 'NP',
  currency: 'NPR',
  discount_type: 'percentage',
  discount_value: 0,
  minimum_subtotal: null,
  maximum_discount: null,
  free_shipping: false,
};

export function RegionRuleBuilder({ value, onChange }: RegionRuleBuilderProps) {
  function update(index: number, patch: Partial<CouponRegionRule>) {
    const next = value.map((rule, i) =>
      i === index ? { ...rule, ...patch } : rule
    );
    onChange(next);
  }

  function addRule() {
    onChange([...value, { ...emptyRule }]);
  }

  function removeRule(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-bold text-zinc-600">
          Region rules <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={addRule}
          className="flex items-center gap-1 text-xs font-bold text-[#966FD6] hover:text-[#7d54c2]"
        >
          <Plus className="size-3.5" />
          Add rule
        </button>
      </div>

      {value.length === 0 && (
        <p className="text-xs text-zinc-400 italic">
          At least one region rule is required (e.g. NP / NPR).
        </p>
      )}

      <div className="space-y-3">
        {value.map((rule, i) => (
          <div
            key={i}
            className="relative rounded-xl border border-zinc-200 p-4 grid grid-cols-2 sm:grid-cols-3 gap-3"
          >
            {value.length > 1 && (
              <button
                type="button"
                onClick={() => removeRule(i)}
                className="absolute top-2 right-2 text-zinc-300 hover:text-red-500"
              >
                <Trash2 className="size-4" />
              </button>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1">
                Market
              </label>
              <select
                value={rule.market}
                onChange={(e) =>
                  update(i, { market: e.target.value as CouponRegionRule['market'] })
                }
                className="w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-sm outline-none focus:border-[#966FD6]"
              >
                <option value="NP">NP</option>
                <option value="INT">INT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1">
                Currency
              </label>
              <select
                value={rule.currency}
                onChange={(e) =>
                  update(i, {
                    currency: e.target.value as CouponRegionRule['currency'],
                  })
                }
                className="w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-sm outline-none focus:border-[#966FD6]"
              >
                <option value="NPR">NPR</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1">
                Discount type
              </label>
              <select
                value={rule.discount_type}
                onChange={(e) =>
                  update(i, {
                    discount_type: e.target.value as CouponRegionRule['discount_type'],
                  })
                }
                className="w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-sm outline-none focus:border-[#966FD6]"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1">
                Discount value
              </label>
              <input
                type="number"
                min={0}
                value={rule.discount_value}
                onChange={(e) =>
                  update(i, { discount_value: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-sm outline-none focus:border-[#966FD6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1">
                Min. subtotal
              </label>
              <input
                type="number"
                min={0}
                value={rule.minimum_subtotal ?? ''}
                onChange={(e) =>
                  update(i, {
                    minimum_subtotal:
                      e.target.value === '' ? null : Number(e.target.value),
                  })
                }
                placeholder="—"
                className="w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-sm outline-none focus:border-[#966FD6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1">
                Max. discount
              </label>
              <input
                type="number"
                min={0}
                value={rule.maximum_discount ?? ''}
                onChange={(e) =>
                  update(i, {
                    maximum_discount:
                      e.target.value === '' ? null : Number(e.target.value),
                  })
                }
                placeholder="—"
                className="w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-sm outline-none focus:border-[#966FD6]"
              />
            </div>

            <label className="col-span-2 sm:col-span-3 flex items-center gap-2 text-sm text-zinc-600 mt-1">
              <input
                type="checkbox"
                checked={!!rule.free_shipping}
                onChange={(e) => update(i, { free_shipping: e.target.checked })}
                className="size-4 rounded accent-[#966FD6]"
              />
              Free shipping for this region
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}