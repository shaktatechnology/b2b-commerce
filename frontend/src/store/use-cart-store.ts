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
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + item.quantity }
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
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [], appliedCouponCode: null, appliedCouponDiscount: 0 }),

      itemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, item) => sum + (item.isUnavailable ? 0 : item.price) * item.quantity, 0),

      discountTotal: () =>
        get().items.reduce((sum, item) => sum + (item.isUnavailable ? 0 : (item.discount ?? 0)) * item.quantity, 0),

      setAppliedCoupon: (code, discount) => set({ appliedCouponCode: code, appliedCouponDiscount: discount }),

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
