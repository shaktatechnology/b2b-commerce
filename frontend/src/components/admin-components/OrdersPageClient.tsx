"use client";

import { useState, useEffect, useCallback } from "react";
import type { Order, OrderStatus, PaymentStatus } from "@/src/types/orders";
import { OrdersTable } from "./OrdersTable";
import { CreateOrderModal } from "./CreateOrderForm";
import { updateOrderAdmin, fetchAllOrdersAdmin } from "@/src/lib/orders-api";
import { toast } from "sonner";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Search, Plus, FilterX, ChevronLeft, ChevronRight } from "lucide-react";
import { DatePicker } from "@/src/components/ui/date-picker";
import { format } from "date-fns";

interface Props {
  initialOrders: Order[];
}

const STATUS_COUNTS = (orders: Order[]) => {
  if (!Array.isArray(orders)) return { total: 0, pending: 0, processing: 0, delivered: 0 };
  return {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };
};

export function OrdersPageClient({ initialOrders }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [page, setPage] = useState(1);

  const counts = STATUS_COUNTS(orders);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllOrdersAdmin({
        status: statusFilter || undefined,
        from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
        to: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
        customer: searchQuery || undefined,
        page
      });
      setOrders(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFrom, dateTo, searchQuery, page]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders();
    }, 500);
    return () => clearTimeout(timer);
  }, [loadOrders]);

  function handleCreated(order: Order) {
    setOrders((prev) => [order, ...prev]);
  }

  async function handleUpdateStatus(id: string | number, status: OrderStatus) {
    try {
      const updated = await updateOrderAdmin(id, { status });
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      toast.success(`Order #${id} updated to ${status}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  }

  async function handleUpdatePayment(id: string | number, payment_status: PaymentStatus) {
    try {
      const updated = await updateOrderAdmin(id, { payment_status });
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      toast.success(`Order #${id} payment status updated to ${payment_status}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update payment status");
    }
  }

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  };

  return (
    <div className="space-y-8 font-lato">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-black">
          Order Management
        </h1>
        <p className="mt-1 text-zinc-500 font-medium">
          Monitor, track, and manage customer shipments and payments.
        </p>
      </div>


      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
        <div className="relative flex-1 max-w-sm min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <Input 
            placeholder="Search by customer or order ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 rounded-xl focus-visible:ring-[#966FD6] border-zinc-200 font-medium"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-4 rounded-xl border border-zinc-200 bg-white text-sm font-bold text-zinc-600 focus:border-[#966FD6]/30 focus:outline-none transition-all"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">From:</span>
              <div className="w-40">
                <DatePicker 
                  date={dateFrom} 
                  setDate={setDateFrom} 
                  placeholder="Start Date" 
                  disabled={dateTo ? { after: dateTo } : undefined}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">To:</span>
              <div className="w-40">
                <DatePicker 
                  date={dateTo} 
                  setDate={setDateTo} 
                  placeholder="End Date" 
                  disabled={dateFrom ? { before: dateFrom } : undefined}
                />
              </div>
            </div>
          </div>
          
          {(searchQuery || statusFilter || dateFrom || dateTo) && (
            <Button 
              variant="ghost" 
              onClick={clearFilters}
              className="h-11 px-4 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all font-bold gap-2"
            >
              <FilterX className="size-4" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-50 overflow-hidden relative">
        <div className="flex items-center justify-between border-b border-zinc-50 px-6 py-5 bg-zinc-50/30">
          <h2 className="text-lg font-black text-black">Order Registry</h2>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-zinc-400">
              Page {page}
            </span>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                disabled={page <= 1 || loading} 
                onClick={() => setPage(p => p - 1)}
                className="size-8 rounded-lg"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                disabled={loading}
                onClick={() => setPage(p => p + 1)}
                className="size-8 rounded-lg"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
        <OrdersTable 
          orders={orders} 
          isLoading={loading}
          onUpdateStatus={handleUpdateStatus}
          onUpdatePayment={handleUpdatePayment}
        />
      </div>

      <CreateOrderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
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
      className={`rounded-2xl p-6 transition-all border ${
        primary 
          ? 'bg-[#966FD6] border-[#966FD6] shadow-lg shadow-[#966FD6]/20' 
          : 'bg-white border-zinc-100 shadow-sm hover:shadow-md'
      }`}
    >
      <p
        className={`text-[10px] font-black uppercase tracking-widest ${
          primary ? 'text-white/70' : 'text-zinc-400'
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-black tabular-nums ${
          primary ? 'text-white' : 'text-black'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
