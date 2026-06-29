"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/src/store/use-cart-store";
import { formatPrice, getActiveCurrency } from "@/src/lib/product-utils";
import { getAuthToken, getUserRole } from "@/src/lib/auth";
import type { CartProductInput } from "@/src/types/cart";
import RecommendedProductCard from "./RecommendedProductCard";
import { ConfirmDialog } from "@/src/components/modals/confirm-dialog";

interface CartPageClientProps {
  recommendedProducts: CartProductInput[];
  contactPhone?: string;
}

const SHIPPING_ESTIMATE = 0;

export default function CartPageClient({
  recommendedProducts,
  contactPhone,
}: CartPageClientProps) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotal);
  const itemCount = useCartStore((s) => s.itemCount);

  const [coupon, setCoupon] = useState("");
  const carouselRef = useRef<HTMLDivElement>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [variantToRemove, setVariantToRemove] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [activeCurrency, setActiveCurrency] = useState<'NPR' | 'USD'>('NPR');

  useEffect(() => {
    setRole(getUserRole());
    const cur = getActiveCurrency();
    setActiveCurrency(cur);
    useCartStore.getState().syncCurrency(cur);

    const onChange = () => {
      const updatedCur = getActiveCurrency();
      setActiveCurrency(updatedCur);
      useCartStore.getState().syncCurrency(updatedCur);
    };
    window.addEventListener('currency_changed', onChange);
    return () => window.removeEventListener('currency_changed', onChange);
  }, []);

  // Derive cart currency from items (stamped at Add-to-Cart time)
  const cartCurrency: 'NPR' | 'USD' = (items[0]?.currency as 'NPR' | 'USD') ?? activeCurrency;
  const fmt = (amount: number) => formatPrice(amount, cartCurrency, 0);

  const isWholesaler = role === "wholesaler";

  const rawSubtotal = subtotal();
  const totalDiscount = useCartStore((s) => s.discountTotal)();
  const subtotalAmount = rawSubtotal - totalDiscount;
  const totalAmount = subtotalAmount + SHIPPING_ESTIMATE;
  const totalItems = itemCount();

  const cartVariantIds = new Set(items.map((i) => i.variantId));
  const suggestions = recommendedProducts
    .filter((p) => {
      const vid = p.variants?.[0]?.id;
      return vid && !cartVariantIds.has(String(vid));
    })
    .slice(0, 12);

  const scrollRecommendations = () => {
    carouselRef.current?.scrollBy({ left: 220, behavior: "smooth" });
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error("Your cart is empty. Add products before checkout.");
      return;
    }

    // Currency safety: cart items must match the active currency toggle
    const mixedCurrencies = items.some((i) => (i as any).currency && (i as any).currency !== cartCurrency);
    if (mixedCurrencies) {
      toast.error("Your cart contains items with mixed currencies. Refreshing prices...");
      useCartStore.getState().syncCurrency(activeCurrency);
      return;
    }
    if (cartCurrency !== activeCurrency) {
      toast.error("Updating cart prices to match your currency selection...");
      useCartStore.getState().syncCurrency(activeCurrency);
      return;
    }

    for (const item of items) {
      const moq = item.moq ?? 1;
      if (isWholesaler && item.quantity < moq) {
        toast.error(`Item "${item.name}" does not meet the wholesale MOQ of ${moq}.`);
        return;
      }
      if (item.stock !== undefined && item.stock <= 0) {
        toast.error(`Item "${item.name}" is out of stock and cannot be checked out.`);
        return;
      }
      if (item.stock !== undefined && item.quantity > item.stock) {
        toast.error(`Item "${item.name}" only has ${item.stock} unit${item.stock === 1 ? "" : "s"} available.`);
        return;
      }
    }
    const token = getAuthToken();
    if (!token) {
      router.push("/login?redirect=/checkout");
      return;
    }
    router.push("/checkout");
  };

  const handleRemoveClick = (variantId: string) => {
    setVariantToRemove(variantId);
    setConfirmOpen(true);
  };

  const handleConfirmRemove = () => {
    if (variantToRemove) {
      removeItem(variantToRemove);
    }
    setConfirmOpen(false);
    setVariantToRemove(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-10 py-6 pb-16">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <span className="mx-2 text-gray-400">&gt;</span>
        <span className="text-primary font-medium">Cart</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 w-full min-w-0 space-y-4">
          {items.length === 0 ? (
            <div className="border border-gray-200 rounded-lg p-10 text-center bg-gray-50">
              <p className="text-gray-600 mb-4">Your cart is empty.</p>
              <Link
                href="/"
                className="inline-block text-primary font-medium hover:underline"
              >
                Continue shopping
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.variantId}
                className="flex gap-4 border border-gray-200 rounded-lg p-4 bg-white"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 border border-gray-200 rounded bg-gray-50 flex items-center justify-center overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-gray-400 text-center px-1">
                      No image
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">{item.category}</p>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base mt-0.5 line-clamp-2">
                    {item.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <p className="text-primary font-bold text-lg">
                      {fmt(item.price - (item.discount ?? 0))}
                    </p>
                    {(item.discount ?? 0) > 0 && (
                      <>
                        <span className="text-gray-400 line-through text-sm">
                          {fmt(item.price)}
                        </span>
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-medium">
                          {Math.round(((item.discount ?? 0) / item.price) * 100)}% off
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-primary mt-1">
                    By <span className="font-medium">{item.seller}</span>
                  </p>
                </div>

                <div className="flex flex-col items-end justify-between shrink-0 gap-3">
                  <div className="flex items-center border border-gray-300 rounded overflow-hidden text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        const minQty = isWholesaler ? (item.moq ?? 1) : 1;
                        if (item.quantity <= minQty) {
                          toast.error(`Minimum order quantity for the item is ${minQty}.`);
                          return;
                        }
                        updateQuantity(item.variantId, item.quantity - 1);
                      }}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-600"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const newQty = parseInt(e.target.value, 10);
                        if (!isNaN(newQty)) {
                          updateQuantity(item.variantId, newQty);
                        }
                      }}
                      onBlur={(e) => {
                        const newQty = parseInt(e.target.value, 10);
                        if (isNaN(newQty)) return;
                        const minQty = isWholesaler ? (item.moq ?? 1) : 1;
                        if (newQty < minQty) {
                          toast.error(`Minimum order quantity is ${minQty}.`);
                          updateQuantity(item.variantId, minQty);
                          return;
                        }
                        if (item.stock !== undefined && newQty > item.stock) {
                          toast.error(`Only ${item.stock} unit${item.stock === 1 ? "" : "s"} are available.`);
                          updateQuantity(item.variantId, item.stock);
                          return;
                        }
                      }}
                      className={`${isWholesaler ? "w-20 h-10 text-base" : "w-10 h-8 text-sm"} flex items-center justify-center border-x border-gray-300 font-medium text-center outline-none bg-white`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (item.stock !== undefined && item.quantity >= item.stock) {
                          toast.error(`Only ${item.stock} unit${item.stock === 1 ? "" : "s"} are available.`);
                          return;
                        }
                        updateQuantity(item.variantId, item.quantity + 1);
                      }}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-600"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveClick(item.variantId)}
                    className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 hover:bg-red-500 px-3 py-1.5 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <aside className="w-full lg:w-[340px] shrink-0 border border-gray-200 rounded-lg p-5 bg-white lg:sticky lg:top-6">
          <a
            href={contactPhone ? `tel:${contactPhone}` : "#"}
            className="block w-full text-center text-sm text-primary border border-primary rounded py-2 hover:bg-primary/5 transition-colors mb-5"
          >
            Contact For Any Querry
          </a>

          <h2 className="text-primary font-semibold text-base border-b-2 border-primary pb-1 inline-block mb-4">
            Order Summary ({totalItems} {totalItems === 1 ? "item" : "items"})
          </h2>



          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">{fmt(rawSubtotal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between">
                <span className="text-green-600">Discount</span>
                <span className="font-semibold text-green-600">-{fmt(totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Shipping</span>
              <span className="font-semibold">{fmt(SHIPPING_ESTIMATE)}</span>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-center">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="font-bold text-primary text-lg">
              {fmt(totalAmount)}
            </span>
          </div>

          <p className="text-primary text-sm mt-5 mb-2">Got a coupon?</p>
          <input
            type="text"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
            placeholder="COUPON CODE"
            className="w-full bg-gray-100 border border-gray-200 rounded px-3 py-2 text-sm placeholder:text-gray-400 outline-none focus:border-primary"
          />

          <button
            type="button"
            onClick={handleCheckout}
            disabled={items.length === 0}
            className="w-full mt-5 bg-primary cursor-pointer text-white font-medium py-3 rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Proceed to Checkout
          </button>
        </aside>
      </div>

      {suggestions.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl text-primary font-semibold mb-5">
            Customer Also Viewed
          </h2>
          <div className="relative">
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide pb-2 pr-12"
            >
              {suggestions.map((product) => (
                <RecommendedProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={scrollRecommendations}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-gray-300 bg-white shadow flex items-center justify-center text-primary hover:bg-gray-50"
              aria-label="Scroll recommendations"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </section>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmRemove}
        title="Remove item"
        description="Are you sure you want to remove this item from the cart?"
        confirmLabel="Remove"
        overlayClassName="bg-black/50 backdrop-blur-none"
        // variant="destructive"
      />
    </div>
  );
}
