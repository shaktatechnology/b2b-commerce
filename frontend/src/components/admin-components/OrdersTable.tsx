import type { Order, OrderStatus, PaymentStatus } from "@/src/types/orders";
import { StatusBadge } from "./StatusBadge";
import { Skeleton } from "@/src/components/ui/skeleton";

interface Props {
  orders: Order[];
  isLoading?: boolean;
  onUpdateStatus?: (id: string | number, status: OrderStatus) => void;
  onUpdatePayment?: (id: string | number, payment: PaymentStatus) => void;
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

export function OrdersTable({ orders, isLoading, onUpdateStatus, onUpdatePayment }: Props) {
  return (
    <div className="overflow-x-auto scrollbar-hide">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: "#faf7ff" }}>
            {["Order ID", "Customer", "Status", "Payment", "Date"].map(
              (h) => (
                <th
                  key={h}
                  className="px-5 py-4 text-left text-xs font-black uppercase tracking-widest"
                  style={{ color: "#966FD6" }}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td className="px-5 py-5">
                  <Skeleton className="h-4 w-12 rounded" />
                  <Skeleton className="mt-2 h-3 w-24 rounded" />
                </td>
                <td className="px-5 py-5">
                  <Skeleton className="h-4 w-32 rounded" />
                </td>
                <td className="px-5 py-5">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="mt-2 h-4 w-24 rounded" />
                </td>
                <td className="px-5 py-5">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="mt-2 h-4 w-20 rounded" />
                </td>
                <td className="px-5 py-5">
                  <Skeleton className="h-4 w-20 rounded" />
                </td>
              </tr>
            ))
          ) : orders.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-20 text-center">
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
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr
                key={order.id}
                className="transition-colors hover:bg-[#faf7ff]"
              >
                <td className="px-5 py-5">
                  <span className="font-mono text-xs font-black" style={{ color: "#966FD6" }}>
                    #{String(order.id).padStart(4, "0")}
                  </span>
                  <div className="mt-1 text-[10px] text-zinc-400 font-medium max-w-[150px] truncate">
                    {order.shipping_address.street}
                  </div>
                </td>
                <td className="px-5 py-5">
                  <span className="font-bold text-zinc-800">
                    {order.customer ?? "—"}
                  </span>
                </td>
                <td className="px-5 py-5">
                  <div className="flex flex-col gap-2">
                    <StatusBadge status={order.status} />
                    <select 
                      value={order.status}
                      onChange={(e) => onUpdateStatus?.(order.id, e.target.value as OrderStatus)}
                      className="text-[10px] bg-transparent border border-zinc-200 rounded px-1 py-0.5 font-bold text-zinc-500 focus:outline-none focus:border-[#966FD6]"
                    >
                      {ALL_STATUSES.map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="px-5 py-5">
                  <div className="flex flex-col gap-2">
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
                      className="text-[10px] bg-transparent border border-zinc-200 rounded px-1 py-0.5 font-bold text-zinc-500 focus:outline-none focus:border-[#966FD6]"
                    >
                      {ALL_PAYMENTS.map(p => (
                        <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="px-5 py-5 text-xs text-zinc-400 font-bold">
                  {formatDate(order.created_at)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
