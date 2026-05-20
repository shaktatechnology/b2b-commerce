import type { OrderStatus } from "@/types/orders";

const STATUS_STYLES: Record<OrderStatus, { bg: string; text: string; dot: string }> = {
  pending:    { bg: "#fff8e6", text: "#92610a", dot: "#f59e0b" },
  processing: { bg: "#f3edfb", text: "#6b3fb5", dot: "#966FD6" },
  shipped:    { bg: "#edf4fb", text: "#1d5fa8", dot: "#3b82f6"  },
  delivered:  { bg: "#ecfbf4", text: "#166534", dot: "#22c55e"  },
  cancelled:  { bg: "#fef2f2", text: "#991b1b", dot: "#ef4444"  },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: s.dot }}
      />
      {status}
    </span>
  );
}
