import type { Order } from "@/types/orders";
import { StatusBadge } from "./StatusBadge";

interface Props {
  orders: Order[];
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function OrdersTable({ orders }: Props) {
  if (!orders.length) {
    return (
      <div className="py-20 text-center">
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
        <p className="text-sm font-semibold text-zinc-500">No orders yet</p>
        <p className="mt-1 text-xs text-zinc-400">
          Create your first order using the button above.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: "#faf7ff" }}>
            {["Order ID", "Customer", "Shipping address", "Status", "Date"].map(
              (h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#966FD6" }}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50">
          {orders.map((order) => (
            <tr
              key={order.id}
              className="transition-colors hover:bg-[#faf7ff]"
            >
              <td className="px-5 py-4">
                <span className="font-mono text-xs font-semibold" style={{ color: "#966FD6" }}>
                  #{String(order.id).padStart(4, "0")}
                </span>
              </td>
              <td className="px-5 py-4">
                <span className="font-semibold text-zinc-800">
                  {order.customer ?? "—"}
                </span>
              </td>
              <td className="max-w-xs px-5 py-4">
                <span className="truncate text-zinc-400 text-xs">
                  {order.shipping_address.street}, {order.shipping_address.city},{" "}
                  {order.shipping_address.state} {order.shipping_address.zip}
                </span>
              </td>
              <td className="px-5 py-4">
                <StatusBadge status={order.status} />
              </td>
              <td className="px-5 py-4 text-xs text-zinc-400">
                {formatDate(order.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
