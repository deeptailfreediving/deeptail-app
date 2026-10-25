import { statusLabel } from "@/lib/requests";

const style: Record<keyof typeof statusLabel, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  APPROVED: "bg-emerald-100 text-emerald-900",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-700",
  COMPLETED: "bg-brand-tint text-brand-mid",
};

export default function StatusBadge({ status }: { status: keyof typeof statusLabel }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${style[status]}`}>{statusLabel[status]}</span>;
}
