"use client";

import { useState, useEffect, useCallback } from "react";
import type { Order, OrderStatus, PaymentStatus } from "@/src/types/orders";
import { OrdersTable } from "./OrdersTable";
import { CreateOrderModal } from "./CreateOrderForm";
import { updateOrderAdmin, fetchAllOrdersAdmin } from "@/src/lib/orders-api";
import { toast } from "sonner";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Search, Plus, FilterX } from "lucide-react";
import { DatePicker } from "@/src/components/ui/date-picker";
import { format } from "date-fns";
import { PageHeader } from "@/src/components/layout-components/page-wrapper";
import { Pagination } from "@/src/components/ui/pagination";
import { Modal, ModalContent, ModalHeader, ModalTitle } from "@/src/components/modals/modal";
import { StatusBadge } from "./StatusBadge";
import { formatOrderAmount } from "@/src/lib/currency";

interface Props {
  initialOrders: Order[];
  initialTotal?: number;
  initialLastPage?: number;
  initialPerPage?: number;
}

export function OrdersPageClient({
  initialOrders,
  initialTotal = 0,
  initialLastPage = 1,
  initialPerPage = 15,
}: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("");

  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  // Pagination State
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialLastPage);
  const [perPage, setPerPage] = useState(initialPerPage);

  // Selected Order for Details View Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAllOrdersAdmin({
        status: statusFilter || undefined,
        from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
        to: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
        customer: searchQuery || undefined,
        user_type: userTypeFilter || undefined,
        page
      });
      setOrders(res.orders);
      setTotal(res.total);
      setTotalPages(res.lastPage);
      setPerPage(res.perPage);
    } catch (err: any) {
      toast.error(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFrom, dateTo, searchQuery, userTypeFilter, page]);

  // Debounced search / filter loading
  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders();
    }, 400);
    return () => clearTimeout(timer);
  }, [loadOrders]);

  // Reset page to 1 whenever any filter is updated to prevent out-of-bounds page issues
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, dateFrom, dateTo, userTypeFilter]);

  function handleCreated(order: Order) {
    setOrders((prev) => [order, ...prev]);
  }

  async function handleUpdateStatus(id: string | number, status: OrderStatus) {
    try {
      const updated = await updateOrderAdmin(id, { status });
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      toast.success(`Order #${id} updated to ${status}`);
      // Also update selectedOrder details view if open
      setSelectedOrder((prev) => prev && prev.id === id ? { ...prev, status } : prev);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  }

  async function handleUpdatePayment(id: string | number, payment_status: PaymentStatus) {
    try {
      const updated = await updateOrderAdmin(id, { payment_status });
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      toast.success(`Order #${id} payment status updated to ${payment_status}`);
      // Also update selectedOrder details view if open
      setSelectedOrder((prev) => prev && prev.id === id ? { ...prev, payment_status } : prev);
    } catch (err: any) {
      toast.error(err.message || "Failed to update payment status");
    }
  }

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setUserTypeFilter("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  };

  const getImageUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    const host = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace("/api", "");
    return `${host}${url}`;
  };

  return (
    <div className="space-y-8 font-lato">
      {/* Header */}
      <PageHeader
        title="Order Management"
        description="Monitor, track, and manage customer shipments and payments."
      />

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
        <div className="relative flex-1 max-w-sm min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <Input
            placeholder="Search by name, email, or order number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 rounded-xl focus-visible:ring-[#966FD6] border-zinc-200 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Status Filter */}
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

          {/* User Type Filter */}
          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
            className="h-11 px-4 rounded-xl border border-zinc-200 bg-white text-sm font-bold text-zinc-600 focus:border-[#966FD6]/30 focus:outline-none transition-all"
          >
            <option value="">All User Types</option>
            <option value="retail">Retail</option>
            <option value="wholesale">Wholesale</option>
          </select>

          {/* Date Range Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">From:</span>
              <div className="w-50">
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
              <div className="w-50">
                <DatePicker
                  date={dateTo}
                  setDate={setDateTo}
                  placeholder="End Date"
                  disabled={dateFrom ? { before: dateFrom } : undefined}
                />
              </div>
            </div>
          </div>

          {(searchQuery || statusFilter || userTypeFilter || dateFrom || dateTo) && (
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
        </div>

        <OrdersTable
          orders={orders}
          isLoading={loading}
          onUpdateStatus={handleUpdateStatus}
          onUpdatePayment={handleUpdatePayment}
          onViewDetails={(order) => setSelectedOrder(order)}
          page={page}
          perPage={perPage}
        />

        {/* Pagination Section using UI component */}
        <div className="px-6 py-4 border-t border-zinc-50 bg-zinc-50/10">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
            totalItems={total}
            itemsPerPage={perPage}
          />
        </div>
      </div>

      <CreateOrderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />

      {/* View Details Modal */}
      {selectedOrder && (
        <Modal open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <ModalContent className="max-w-4xl max-h-[85vh] overflow-y-auto font-lato rounded-2xl p-6 bg-white text-zinc-950 border border-zinc-200 shadow-2xl">
            <ModalHeader className="mb-4 pb-2 border-b border-zinc-200 flex flex-row items-center justify-between">
              <ModalTitle className="text-xl font-black text-zinc-950">
                Order details: {selectedOrder.order_number || `#${selectedOrder.id}`}
              </ModalTitle>
            </ModalHeader>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Order Info & Customer Info */}
              <div className="md:col-span-1 space-y-6">
                {/* Status card */}
                <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#966FD6]">
                    Status & Payment
                  </h3>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-600 font-bold">Order:</span>
                      <StatusBadge status={selectedOrder.status} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-600 font-bold">Payment:</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedOrder.payment_status === 'paid' ? 'bg-green-50 text-green-600' :
                        selectedOrder.payment_status === 'refunded' ? 'bg-zinc-50 text-zinc-600' :
                          'bg-red-50 text-red-600'
                        }`}>
                        {selectedOrder.payment_status || 'Unpaid'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-600 font-bold">User Type:</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${selectedOrder.user_type === 'wholesale' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                        {selectedOrder.user_type || 'Retail'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#966FD6]">
                    Customer info
                  </h3>
                  <div className="space-y-2 text-sm text-zinc-700 font-medium">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Name</p>
                      <p className="text-zinc-950 font-bold">{selectedOrder.user?.name ?? selectedOrder.customer ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Email</p>
                      <p className="text-zinc-950 truncate">{selectedOrder.user?.email ?? '—'}</p>
                    </div>
                    {selectedOrder.user?.phone && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Phone</p>
                        <p className="text-zinc-950">{selectedOrder.user.phone}</p>
                      </div>
                    )}
                    {selectedOrder.user?.company_name && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Company</p>
                        <p className="text-zinc-950 font-bold">{selectedOrder.user.company_name}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#966FD6]">
                    Shipping address
                  </h3>
                  {selectedOrder.shipping_address ? (
                    <div className="text-sm text-zinc-700 font-medium space-y-1">
                      <p className="text-zinc-950 font-bold">{selectedOrder.shipping_address.street}</p>
                      <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}</p>
                      <p>{selectedOrder.shipping_address.zip}, {selectedOrder.shipping_address.country}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 italic">No address provided</p>
                  )}
                </div>
              </div>

              {/* Items & Summary */}
              <div className="md:col-span-2 space-y-6">
                {/* Product details */}
                <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-4 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#966FD6] border-b border-zinc-150 pb-2">
                    Product details & Items
                  </h3>
                  <div className="divide-y divide-zinc-100 max-h-[300px] overflow-y-auto pr-1">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item) => {
                        const image = item.variant?.image_url ?? item.variant?.product?.image_url;
                        const fullImageUrl = getImageUrl(image);
                        return (
                          <div key={item.id} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                            {/* Product Image */}
                            <div className="size-16 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-center overflow-hidden shrink-0">
                              {fullImageUrl ? (
                                <img
                                  src={fullImageUrl}
                                  alt={item.variant?.product?.name ?? "Product image"}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-[10px] font-bold text-zinc-500">No Image</span>
                              )}
                            </div>
                            {/* Product info */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-zinc-950 text-sm truncate">
                                {item.variant?.product?.name ?? "Unknown Product"}
                              </h4>
                              <p className="text-xs font-bold text-zinc-500 mt-0.5">
                                Variant: {item.variant?.variant_name ?? "Default"}
                              </p>
                              {item.variant?.sku && (
                                <p className="text-[10px] font-mono text-[#966FD6] mt-0.5">
                                  SKU: {item.variant.sku}
                                </p>
                              )}
                            </div>
                            {/* Pricing & Quantities */}
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-zinc-950">
                                {formatOrderAmount(selectedOrder, item.unit_price)} × {item.quantity}
                              </p>
                              {Number(item.discount_amount) > 0 && (
                                <p className="text-[10px] text-green-600 font-bold">
                                  Disc: {formatOrderAmount(selectedOrder, item.discount_amount)}
                                </p>
                              )}
                              <p className="text-xs font-black text-zinc-950 mt-1">
                                Total: {formatOrderAmount(selectedOrder, item.line_total)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-zinc-500 italic py-4 text-center">No items listed</p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 shadow-sm">
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#966FD6] mb-1">
                      Order notes
                    </h4>
                    <p className="text-sm font-medium text-zinc-800 italic">
                      "{selectedOrder.notes}"
                    </p>
                  </div>
                )}

                {/* Order Totals Summary */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-2.5 shadow-sm">
                  <div className="flex justify-between text-sm font-bold text-zinc-650">
                    <span>Subtotal:</span>
                    <span className="text-zinc-950">{formatOrderAmount(selectedOrder, selectedOrder.subtotal)}</span>
                  </div>
                  {Number(selectedOrder.discount_amount) > 0 && (
                    <div className="flex justify-between text-sm font-bold text-green-600">
                      <span>Discount amount:</span>
                      <span>- {formatOrderAmount(selectedOrder, selectedOrder.discount_amount)}</span>
                    </div>
                  )}
                  <div className="border-t border-zinc-250 pt-2 flex justify-between text-base font-black text-zinc-950">
                    <span>Grand Total:</span>
                    <span className="text-[#966FD6]">{formatOrderAmount(selectedOrder, selectedOrder.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}