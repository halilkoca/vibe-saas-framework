"use client";

import { useTransition } from "react";
import { updateLeadStatusAction, deleteLeadAction } from "./actions";

type Lead = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
};

const STATUS_LABELS: Record<string, string> = {
  new: "Yeni",
  contacted: "İletişimde",
  lost: "Kayıp",
  won: "Kazanıldı",
};

export function LeadRow({ lead }: { lead: Lead }) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value;
    startTransition(() => updateLeadStatusAction(lead.id, status));
  }

  function handleDelete() {
    if (!confirm(`"${lead.full_name}" silinsin mi? Bu işlem geri alınamaz.`)) return;
    startTransition(() => deleteLeadAction(lead.id));
  }

  return (
    <tr className={isPending ? "opacity-50" : ""}>
      <td className="px-5 py-3 font-medium">{lead.full_name}</td>
      <td className="px-5 py-3 text-muted">
        {lead.email && <div>{lead.email}</div>}
        {lead.phone && <div>{lead.phone}</div>}
        {!lead.email && !lead.phone && "—"}
      </td>
      <td className="px-5 py-3 text-muted">{lead.source ?? "—"}</td>
      <td className="px-5 py-3">
        <select
          value={lead.status}
          onChange={handleStatusChange}
          disabled={isPending}
          className="rounded-lg border border-border px-2 py-1 text-xs focus-visible:ring-2 focus-visible:ring-accent"
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-5 py-3 text-right">
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs text-muted hover:text-red-600 transition"
        >
          Sil
        </button>
      </td>
    </tr>
  );
}
