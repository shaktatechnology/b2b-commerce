"use client";

import { useState, useEffect, useCallback } from "react";
import { Payment, PaymentStatus } from "@/src/types/payments";
import { fetchAllPaymentsAdmin } from "@/src/lib/payments-api";
import { PageHeader } from "@/src/components/layout-components/page-wrapper";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Search, FilterX, ChevronLeft, ChevronRight, CreditCard, DollarSign } from "lucide-react";
import { DatePicker } from "@/src/components/ui/date-picker";
import { format } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/utils";

interface Props {
  initialPayments: Payment[];
}

export function PaymentsPageClient({ initialPayments }: Props) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [page, setPage] = useState(1);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllPaymentsAdmin({
        status: statusFilter || undefined,
        from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
        to: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
        customer: searchQuery || undefined,
        page
      });
      setPayments(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFrom, dateTo, searchQuery, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPayments();
    }, 500);
    return () => clearTimeout(timer);
  }, [loadPayments]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  };

  return (
    <div className="space-y-8 font-lato">
      <PageHeader 
        title="Payment History" 
        description="Track all wholesale transactions and financial settlements."
      />

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
        <div className="relative flex-1 max-w-sm min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <Input 
            placeholder="Search by ID, customer or order..." 
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
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

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

      {/* Table Card */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-50 overflow-hidden relative">
        <div className="flex items-center justify-between border-b border-zinc-50 px-6 py-5 bg-zinc-50/30">
          <h2 className="text-lg font-black text-black">Transaction Ledger</h2>
          <div className="flex items-center gap-4">
             <span className="text-xs font-bold text-zinc-400">Page {page}</span>
             <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)} className="size-8 rounded-lg">
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" disabled={loading} onClick={() => setPage(p => p + 1)} className="size-8 rounded-lg">
                  <ChevronRight className="size-4" />
                </Button>
             </div>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50/50">
                {["Transaction ID", "Order ID", "Customer", "Amount", "Status", "Date"].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-[#966FD6]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-5"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-5"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-6 py-5"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-5"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-6 py-5"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-6 py-5"><Skeleton className="h-4 w-24" /></td>
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <p className="text-sm font-semibold text-zinc-500">No payments found</p>
                  </td>
                </tr>
              ) : (
                payments.map(p => (
                  <tr key={p.id} className="transition-colors hover:bg-zinc-50/50">
                    <td className="px-6 py-5 font-mono text-xs font-black text-[#966FD6]">
                      #{p.transaction_id || p.id}
                    </td>
                    <td className="px-6 py-5 font-bold text-zinc-900">
                      #{p.order_id}
                    </td>
                    <td className="px-6 py-5 font-medium text-zinc-600">
                      {p.customer_name || "—"}
                    </td>
                    <td className="px-6 py-5 font-black text-black">
                      ${p.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-5">
                      <PaymentBadge status={p.status} />
                    </td>
                    <td className="px-6 py-5 text-xs text-zinc-400 font-bold">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const styles = {
    completed: "bg-green-50 text-green-600 border-green-100",
    pending: "bg-amber-50 text-amber-600 border-amber-100",
    failed: "bg-red-50 text-red-600 border-red-100",
    refunded: "bg-zinc-50 text-zinc-600 border-zinc-100",
  };
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", styles[status])}>
      {status}
    </span>
  );
}
