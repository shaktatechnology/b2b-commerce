import type { Order, OrderStatus, PaymentStatus } from "@/src/types/orders";
import { formatOrderAmount } from "@/src/lib/currency";
import { StatusBadge } from "./StatusBadge";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Eye } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/src/components/ui/table";

interface Props {
  orders: Order[];
  isLoading?: boolean;
  onUpdateStatus?: (id: string | number, status: OrderStatus) => void;
  onUpdatePayment?: (id: string | number, payment: PaymentStatus) => void;
  onViewDetails?: (order: Order) => void;
  page?: number;
  perPage?: number;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const ALL_STATUSES: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const ALL_PAYMENTS: PaymentStatus[] = ["unpaid", "paid", "refunded"];

export function OrdersTable({
  orders,
  isLoading,
  onUpdateStatus,
  onUpdatePayment,
  onViewDetails,
  page = 1,
  perPage = 15,
}: Props) {
  const startIndex = (page - 1) * perPage;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader style={{ backgroundColor: "#faf7ff" }}>
          <TableRow className="border-zinc-100 hover:bg-transparent">
            <TableHead className="px-5 py-4 text-xs font-black uppercase tracking-widest text-center w-12" style={{ color: "#966FD6" }}>
              SN
            </TableHead>
            <TableHead className="px-5 py-4 text-xs font-black uppercase tracking-widest" style={{ color: "#966FD6" }}>
              Order No
            </TableHead>
            <TableHead className="px-5 py-4 text-xs font-black uppercase tracking-widest" style={{ color: "#966FD6" }}>
              Customer
            </TableHead>
            <TableHead className="px-5 py-4 text-xs font-black uppercase tracking-widest" style={{ color: "#966FD6" }}>
              User Type
            </TableHead>
            <TableHead className="px-5 py-4 text-xs font-black uppercase tracking-widest" style={{ color: "#966FD6" }}>
              Status
            </TableHead>
            <TableHead className="px-5 py-4 text-xs font-black uppercase tracking-widest" style={{ color: "#966FD6" }}>
              Payment
            </TableHead>
            <TableHead className="px-5 py-4 text-xs font-black uppercase tracking-widest" style={{ color: "#966FD6" }}>
              Total
            </TableHead>
            <TableHead className="px-5 py-4 text-xs font-black uppercase tracking-widest" style={{ color: "#966FD6" }}>
              Date
            </TableHead>
            <TableHead className="px-5 py-4 text-xs font-black uppercase tracking-widest text-right" style={{ color: "#966FD6" }}>
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-zinc-50">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="px-5 py-5 text-center">
                  <Skeleton className="h-4 w-6 mx-auto rounded" />
                </TableCell>
                <TableCell className="px-5 py-5">
                  <Skeleton className="h-4 w-28 rounded" />
                </TableCell>
                <TableCell className="px-5 py-5">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="mt-1 h-3 w-40 rounded" />
                </TableCell>
                <TableCell className="px-5 py-5">
                  <Skeleton className="h-5 w-16 rounded" />
                </TableCell>
                <TableCell className="px-5 py-5">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="mt-2 h-4 w-24 rounded" />
                </TableCell>
                <TableCell className="px-5 py-5">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="mt-2 h-4 w-20 rounded" />
                </TableCell>
                <TableCell className="px-5 py-5">
                  <Skeleton className="h-4 w-16 rounded" />
                </TableCell>
                <TableCell className="px-5 py-5">
                  <Skeleton className="h-4 w-20 rounded" />
                </TableCell>
                <TableCell className="px-5 py-5 text-right">
                  <Skeleton className="h-8 w-12 ml-auto rounded" />
                </TableCell>
              </TableRow>
            ))
          ) : orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="py-20 text-center">
                <div
                  className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: "#f3edfb" }}
                >
                  <svg
                    className="size-5"
                    style={{ color: "#966FD6" }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 3H8l-2 4h12l-2-4z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-zinc-500">No orders found</p>
                <p className="mt-1 text-xs text-zinc-400 italic">
                  Try adjusting your filters or search terms.
                </p>
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order, idx) => (
              <TableRow
                key={order.id}
                className="transition-colors border-zinc-100 hover:bg-[#faf7ff]"
              >
                <TableCell className="px-5 py-5 text-center font-bold text-zinc-500">
                  {startIndex + idx + 1}
                </TableCell>
                <TableCell className="px-5 py-5">
                  <span className="font-mono text-xs font-black" style={{ color: "#966FD6" }}>
                    {order.order_number || `#${String(order.id).padStart(4, "0")}`}
                  </span>
                  {order.shipping_address?.street && (
                    <div className="mt-1 text-[10px] text-zinc-400 font-medium max-w-[150px] truncate">
                      {order.shipping_address.street}
                    </div>
                  )}
                </TableCell>
                <TableCell className="px-5 py-5">
                  <span className="font-bold text-zinc-800">
                    {order.user?.name ?? order.customer ?? "—"}
                  </span>
                  {order.user?.email && (
                    <div className="text-[10px] text-zinc-400 font-medium truncate">
                      {order.user.email}
                    </div>
                  )}
                </TableCell>
                <TableCell className="px-5 py-5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                    order.user_type === 'wholesale' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {order.user_type || 'Retail'}
                  </span>
                </TableCell>
                <TableCell className="px-5 py-5">
                  <div className="flex flex-col gap-1.5 max-w-[120px]">
                    <StatusBadge status={order.status} />
                    <select 
                      value={order.status}
                      onChange={(e) => onUpdateStatus?.(order.id, e.target.value as OrderStatus)}
                      className="text-[10px] bg-white border border-zinc-200 rounded px-1.5 py-0.5 font-bold text-zinc-500 focus:outline-none focus:border-[#966FD6]"
                    >
                      {ALL_STATUSES.map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-5">
                  <div className="flex flex-col gap-1.5 max-w-[100px]">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      order.payment_status === 'paid' ? 'bg-green-50 text-green-600' :
                      order.payment_status === 'refunded' ? 'bg-zinc-50 text-zinc-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {order.payment_status || 'Unpaid'}
                    </span>
                    <select 
                      value={order.payment_status || 'unpaid'}
                      onChange={(e) => onUpdatePayment?.(order.id, e.target.value as PaymentStatus)}
                      className="text-[10px] bg-white border border-zinc-200 rounded px-1.5 py-0.5 font-bold text-zinc-500 focus:outline-none focus:border-[#966FD6]"
                    >
                      {ALL_PAYMENTS.map(p => (
                        <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-5 font-bold text-zinc-800 text-xs">
                  {formatOrderAmount(order, order.total)}
                </TableCell>
                <TableCell className="px-5 py-5 text-xs text-zinc-400 font-bold">
                  {formatDate(order.created_at)}
                </TableCell>
                <TableCell className="px-5 py-5 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails?.(order)}
                    className="h-8 px-2 rounded-lg text-[#966FD6] hover:text-[#7d5bbf] hover:bg-[#966FD6]/10 font-bold gap-1 active:scale-95"
                  >
                    <Eye className="size-4" />
                    <span>View</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}