"use client";

import { useState } from "react";
import type { Order } from "@/types/orders";
import { OrdersTable } from "./OrdersTable";
import { CreateOrderModal } from "./CreateOrderModal";

interface Props {
  initialOrders: Order[];
}

const STATUS_COUNTS = (orders: Order[]) => ({
  total: orders.length,
  pending: orders.filter((o) => o.status === "pending").length,
  processing: orders.filter((o) => o.status === "processing").length,
  delivered: orders.filter((o) => o.status === "delivered").length,
});

export function OrdersPageClient({ initialOrders }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [modalOpen, setModalOpen] = useState(false);
  const counts = STATUS_COUNTS(orders);

  function handleCreated(order: Order) {
    setOrders((prev) => [order, ...prev]);
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Orders
          </h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            Manage and track all customer orders
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: "#966FD6" }}
        >
          <PlusIcon />
          New order
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total orders" value={counts.total} primary />
        <StatCard label="Pending" value={counts.pending} />
        <StatCard label="Processing" value={counts.processing} />
        <StatCard label="Delivered" value={counts.delivered} />
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-700">All orders</h2>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: "#966FD6" }}>
            {orders.length} {orders.length === 1 ? "order" : "orders"}
          </span>
        </div>
        <OrdersTable orders={orders} />
      </div>

      <CreateOrderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}

function StatCard({
  label,
  value,
  primary,
}: {
  label: string;
  value: number;
  primary?: boolean;
}) {
  return (
    <div
      className="rounded-2xl border p-5 transition-shadow hover:shadow-md"
      style={
        primary
          ? { backgroundColor: "#966FD6", borderColor: "#966FD6" }
          : { backgroundColor: "#fff", borderColor: "#f0ebfa" }
      }
    >
      <p
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: primary ? "rgba(255,255,255,0.75)" : "#966FD6" }}
      >
        {label}
      </p>
      <p
        className="mt-2 text-3xl font-bold tabular-nums"
        style={{ color: primary ? "#fff" : "#3f3356" }}
      >
        {value}
      </p>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg className="size-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M8 3v10M3 8h10" strokeLinecap="round" />
    </svg>
  );
}
