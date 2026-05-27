"use client";

import { useState, useEffect, useCallback } from "react";
import { Payment, PaymentStatus } from "@/src/types/payments";
import { fetchAllPaymentsAdmin } from "@/src/lib/payments-api";
import { PageHeader } from "@/src/components/layout-components/page-wrapper";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Search, FilterX } from "lucide-react";
import { DatePicker } from "@/src/components/ui/date-picker";
import { format } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/utils";
import { Pagination } from "@/src/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";

interface Props {
  initialPayments: Payment[];
  initialTotal?: number;
  initialLastPage?: number;
}

const ITEMS_PER_PAGE = 20;

export function PaymentsPageClient({ initialPayments }: Props) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAllPaymentsAdmin({
        status: statusFilter || undefined,
        from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
        to: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
        customer: searchQuery || undefined,
        page
      });
      
      let data: Payment[] = [];
      let total = 0;
      let lastPage = 1;

      if (Array.isArray(res)) {
          data = res;
          total = res.length;
      } else {
          const resData = res?.data?.data || res?.data || [];
          data = Array.isArray(resData) ? resData : [];
          total = res?.total || res?.meta?.total || data.length;
          lastPage = res?.last_page || res?.meta?.last_page || 1;
      }

      setPayments(data);
      const calculatedPages = Math.ceil(data.length / ITEMS_PER_PAGE);
      setTotalPages(calculatedPages > 0 ? calculatedPages : 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to load payments");
      setPayments([]);
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

  const paginatedPayments = payments.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-11 h-12 rounded-xl focus-visible:ring-[#966FD6] border-zinc-200 font-medium"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
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
                  setDate={(date) => {
                    setDateFrom(date);
                    setPage(1);
                  }}
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
                  setDate={(date) => {
                    setDateTo(date);
                    setPage(1);
                  }}
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
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-50 overflow-hidden">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-zinc-50/30">
              <TableHead className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-[#966FD6]">
                SN
              </TableHead>
              <TableHead className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-[#966FD6]">
                Transaction ID
              </TableHead>
              <TableHead className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-[#966FD6]">
                Order ID
              </TableHead>
              <TableHead className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-[#966FD6]">
                Customer
              </TableHead>
              <TableHead className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-[#966FD6]">
                Amount
              </TableHead>
              <TableHead className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-[#966FD6]">
                Status
              </TableHead>
              <TableHead className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-[#966FD6]">
                Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-6 py-5"><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell className="px-6 py-5"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="px-6 py-5"><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell className="px-6 py-5"><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="px-6 py-5"><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="px-6 py-5"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="px-6 py-5"><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : paginatedPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-20 text-center">
                  <p className="text-sm font-semibold text-zinc-500">No payments found</p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedPayments.map((p, index) => (
                <TableRow key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                  <TableCell className="px-6 py-5 font-bold text-zinc-900">
                    {(page - 1) * ITEMS_PER_PAGE + index + 1}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-mono text-xs font-black text-[#966FD6]">
                    {p.transaction_id || p.id}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-bold text-zinc-900">
                    #{p.order_id}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-medium text-zinc-600">
                    {p.customer_name || "—"}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-black text-black">
                    {p.currency || "Rs."} {Number(p.amount).toLocaleString()}
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <PaymentBadge status={p.status} />
                  </TableCell>
                  <TableCell className="px-6 py-5 text-xs text-zinc-400 font-bold">
                    {new Date(p.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="border-t border-zinc-50 px-6 py-4">
          <Pagination 
            currentPage={page}
            totalPages={totalPages}
            totalItems={payments.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setPage}
          />
        </div>

        {!loading && totalPages > 1 && (
          <div className="border-t border-zinc-50 bg-zinc-50/30">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={totalItems}
              itemsPerPage={10}
            />
          </div>
        )}
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
