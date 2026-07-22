import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartLineItem } from '@/src/types/cart';

interface CartState {
  items: CartLineItem[];
  addItem: (item: CartLineItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: () => number;
  subtotal: () => number;
  discountTotal: () => number;
  syncCurrency: (targetCurrency: 'NPR' | 'USD') => void;
  // Corrects a stale cart item once the backend tells us its variant is no
  // longer active — cart items only carry a snapshot of is_active taken at
  // add-to-cart time, so this keeps local state truthful after a 422.
  markItemInactive: (variantId: string) => void;
  appliedCouponCode: string | null;
  appliedCouponDiscount: number;
  setAppliedCoupon: (code: string | null, discount: number) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCouponCode: null,
      appliedCouponDiscount: 0,

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            // Cap the merged quantity at the item's known stock so repeated
            // "add to cart" calls for the same variant can't push the cart
            // past what's actually available.
            const knownStock = item.stock ?? existing.stock;
            const combined = existing.quantity + item.quantity;
            const nextQuantity =
              knownStock !== undefined && knownStock > 0
                ? Math.min(combined, knownStock)
                : combined;
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: nextQuantity, stock: knownStock ?? i.stock }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        });
      },

      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        }));
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity < 1) {
          get().removeItem(variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => {
            if (i.variantId !== variantId) return i;
            const capped =
              i.stock !== undefined && i.stock > 0 ? Math.min(quantity, i.stock) : quantity;
            return { ...i, quantity: capped };
          }),
        }));
      },

      clearCart: () => set({ items: [], appliedCouponCode: null, appliedCouponDiscount: 0 }),

      setAppliedCoupon: (code, discount) => set({ appliedCouponCode: code, appliedCouponDiscount: discount }),

      markItemInactive: (variantId) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, is_active: false, isUnavailable: true } : i
          ),
        }));
      },

      itemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, item) => sum + ((item.isUnavailable || item.is_active === false) ? 0 : item.price) * item.quantity, 0),

      discountTotal: () =>
        get().items.reduce((sum, item) => sum + ((item.isUnavailable || item.is_active === false) ? 0 : (item.discount ?? 0)) * item.quantity, 0),

      syncCurrency: (targetCurrency) => {
        set((state) => {
          const updatedItems = state.items.map((item) => {
            const currentItemCurrency = (item.currency as 'NPR' | 'USD') || 'NPR';
            let nextPrice = item.price;
            let nextDiscount = item.discount ?? 0;
            let isUnavailable = false;

            if (item.prices && item.discounts) {
              nextPrice = item.prices[targetCurrency] ?? 0;
              nextDiscount = item.discounts[targetCurrency] ?? 0;
            }

            if (targetCurrency === 'USD') {
              const usdVal = item.prices?.USD ?? 0;
              if (usdVal <= 0) {
                isUnavailable = true;
              }
            }

            return {
              ...item,
              price: nextPrice,
              discount: nextDiscount,
              currency: targetCurrency,
              isUnavailable,
            };
          });

          return { items: updatedItems };
        });
      },
    }),
    { name: 'cart-storage' }
  )
);