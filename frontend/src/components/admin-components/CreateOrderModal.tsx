"use client";

import { useState } from "react";
import { createOrder } from "@/src/lib/orders-api";
import type { CreateOrderPayload, Order } from "@/src/types/orders";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (order: Order) => void;
}

const INITIAL = {
  customer: "",
  notes: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
};

export function CreateOrderModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function set(field: keyof typeof INITIAL, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { customer, street, city, state, zip, country, notes } = form;
    if (!customer || !street || !city || !state || !zip || !country) {
      setError("Please fill in all required fields.");
      return;
    }
    const payload: CreateOrderPayload = {
      shipping_address: { street, city, state, zip, country },
      notes: notes.trim() || null,
    };
    setLoading(true);
    setError(null);
    try {
      const order = await createOrder(payload);
      onCreated({
        ...order,
        // keep customer name client-side if API doesn't return it
        customer: form.customer || order.customer,
      });
      setForm(INITIAL);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
        {/* Header */}
        <div className="flex items-start rounded-t-2xl justify-between px-8 pt-8 pb-2 bg-[#966FD6]">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 ">
              New Order
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Checkout the customer&apos;s cart
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-400 transition hover:text-zinc-700 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            <svg className="size-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="bg-white max-h-[65vh] overflow-y-auto px-8 py-5 space-y-4">
            {/* Basic info section */}
            <div className="pt-1">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                Basic information
                <span className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
              </p>
              <div className="space-y-3">
                {/* Customer name */}
                <Field label="Customer name" required>
                  <input
                    type="text"
                    value={form.customer}
                    onChange={(e) => set("customer", e.target.value)}
                    placeholder="Jane Smith"
                    className={input()}
                  />
                </Field>

                {/* Notes */}
                <Field label="Notes" optional>
                  <textarea
                    rows={3}
                    maxLength={2000}
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    placeholder="Delivery instructions, special requests…"
                    className={`${input()} resize-none`}
                  />
                </Field>
              </div>
            </div>

            {/* Address section */}
            <div className="pt-1">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                Shipping address
                <span className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
              </p>
              <div className="space-y-3">
                <Field label="Street" required>
                  <input
                    type="text"
                    value={form.street}
                    onChange={(e) => set("street", e.target.value)}
                    placeholder="123 Main St"
                    maxLength={255}
                    className={input()}
                    required
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="City" required>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => set("city", e.target.value)}
                      placeholder="New York"
                      maxLength={255}
                      className={input()}
                      required
                    />
                  </Field>
                  <Field label="State" required>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) => set("state", e.target.value)}
                      placeholder="NY"
                      maxLength={255}
                      className={input()}
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="ZIP code" required>
                    <input
                      type="text"
                      value={form.zip}
                      onChange={(e) => set("zip", e.target.value)}
                      placeholder="10001"
                      maxLength={20}
                      className={input()}
                      required
                    />
                  </Field>
                  <Field label="Country" required>
                    <input
                      type="text"
                      value={form.country}
                      onChange={(e) => set("country", e.target.value)}
                      placeholder="US"
                      maxLength={255}
                      className={input()}
                      required
                    />
                  </Field>
                </div>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-zinc-100 px-8 py-5 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? (
                <>
                  <Spinner /> Creating…
                </>
              ) : (
                "Checkout cart"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── helpers ────────────────────────────────────────────────────────────────

function input() {
  return "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-300 focus:border-zinc-300 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-600";
}

function Field({
  label,
  required,
  optional,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
        {optional && (
          <span className="ml-1 font-normal normal-case tracking-normal text-zinc-400">(optional)</span>
        )}
      </label>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
        strokeLinecap="round"
      />
    </svg>
  );
}
