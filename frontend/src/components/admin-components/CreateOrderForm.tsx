"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createOrder } from "@/src/lib/orders-api";
import type { CreateOrderPayload, Order } from "@/src/types/orders";
import { Spinner } from "@/src/components/ui/spinner";
import { Button } from "@/src/components/ui/button";

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
      address_id: 'addr_' + Math.random().toString(36).substring(2, 11),
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-zinc-50 bg-zinc-50/30">
          <div>
            <h2 className="text-2xl font-black text-black tracking-tight">
              New Order
            </h2>
            <p className="text-zinc-500 text-sm font-medium mt-1">
              Checkout the customer&apos;s cart
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="bg-white max-h-[65vh] overflow-y-auto px-8 py-5 space-y-4 scrollbar-hide">
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
          <div className="flex flex-col sm:flex-row justify-end gap-3 p-5 border-t border-zinc-50 bg-white">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              className="font-bold rounded-xl text-zinc-500 h-12 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#966FD6] hover:bg-[#7d5bbf] text-white px-10 h-12 rounded-xl font-black shadow-lg shadow-[#966FD6]/20 active:scale-[0.98] w-full sm:w-auto"
            >
              {loading ? (
                <Spinner size="sm" className="border-white mr-2" />
              ) : null}
              Create Order
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── helpers ────────────────────────────────────────────────────────────────

function input() {
  return "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-black placeholder:text-zinc-400 focus:border-[#966FD6] focus:ring-1 focus:ring-[#966FD6] focus:outline-none transition-all";
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

