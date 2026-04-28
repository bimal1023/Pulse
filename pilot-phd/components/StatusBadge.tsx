import type { AppStatus } from "@/lib/store";

const STATUS_CONFIG: Record<
  AppStatus,
  { label: string; dot: string; pill: string }
> = {
  planning:  { label: "Planning",   dot: "bg-gray-400",   pill: "bg-gray-100 text-gray-700"   },
  applied:   { label: "Applied",    dot: "bg-blue-500",   pill: "bg-blue-50 text-blue-700"    },
  waiting:   { label: "Waiting",    dot: "bg-amber-400",  pill: "bg-amber-50 text-amber-700"  },
  accepted:  { label: "Accepted",   dot: "bg-green-500",  pill: "bg-green-50 text-green-700"  },
  rejected:  { label: "Rejected",   dot: "bg-red-500",    pill: "bg-red-50 text-red-700"      },
  withdrawn: { label: "Withdrawn",  dot: "bg-orange-400", pill: "bg-orange-50 text-orange-700"},
};

export default function StatusBadge({ status }: { status: AppStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export { STATUS_CONFIG };
