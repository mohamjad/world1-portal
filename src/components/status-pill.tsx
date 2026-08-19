import { titleCase } from "@/lib/format";

const tones: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-800",
  signed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  pending: "border-amber-200 bg-amber-50 text-amber-900",
  submitted: "border-amber-200 bg-amber-50 text-amber-900",
  overdue: "border-red-200 bg-red-50 text-red-800",
  cancelled: "border-neutral-300 bg-neutral-100 text-neutral-700",
  completed: "border-neutral-300 bg-neutral-100 text-neutral-700",
};

export function StatusPill({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex h-6 items-center border px-2 text-xs font-medium ${
        tones[value] ?? "border-neutral-300 bg-white text-neutral-700"
      }`}
    >
      {titleCase(value)}
    </span>
  );
}
