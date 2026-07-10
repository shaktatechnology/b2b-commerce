'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { Spinner } from '@/src/components/ui/spinner';
import { fetchCouponRedemptions } from '@/src/lib/coupons-api';
import type { Coupon, CouponRedemption } from '@/src/types/coupon';

interface RedemptionsModalProps {
  open: boolean;
  onClose: () => void;
  coupon: Coupon | null;
}

export function RedemptionsModal({
  open,
  onClose,
  coupon,
}: RedemptionsModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [redemptions, setRedemptions] = React.useState<CouponRedemption[]>([]);

  React.useEffect(() => {
    if (!open || !coupon) return;
    setLoading(true);
    fetchCouponRedemptions(coupon.id)
      .then(setRedemptions)
      .catch((err) =>
        toast.error(
          err instanceof Error ? err.message : 'Could not load redemptions'
        )
      )
      .finally(() => setLoading(false));
  }, [open, coupon]);

  if (!open || !coupon) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl max-h-[80vh] overflow-y-auto rounded-2xl bg-white shadow-2xl font-lato">
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-lg font-black text-black">Redemptions</h2>
            <p className="text-xs text-zinc-400 font-semibold">{coupon.name}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-black"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Spinner size="sm" className="size-6 border-zinc-300" />
            </div>
          ) : redemptions.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-10">
              No redemptions yet.
            </p>
          ) : (
            <div className="space-y-2">
              {redemptions.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-bold text-black">
                      {r.user_name ?? r.user_id ?? 'Unknown user'}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {r.order_id ? `Order #${r.order_id}` : ''}
                      {r.redeemed_at
                        ? ` · ${new Date(r.redeemed_at).toLocaleString()}`
                        : ''}
                    </p>
                  </div>
                  {typeof r.discount_applied === 'number' && (
                    <span className="text-sm font-bold text-[#966FD6]">
                      -{r.discount_applied}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}