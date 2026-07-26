"use client";

import { useTransition } from "react";
import { updateDealStageAction } from "./actions";

type Deal = {
  id: string;
  title: string;
  amount: number;
  stage: string;
};

export function DealCard({
  deal,
  stages,
}: {
  deal: Deal;
  stages: readonly { key: string; label: string }[];
}) {
  const [isPending, startTransition] = useTransition();

  function handleMove(e: React.ChangeEvent<HTMLSelectElement>) {
    startTransition(() => updateDealStageAction(deal.id, e.target.value));
  }

  return (
    <div
      className={`rounded-lg border border-border p-3 bg-paper ${isPending ? "opacity-50" : ""}`}
    >
      <p className="text-sm font-medium mb-1">{deal.title}</p>
      <p className="text-xs text-muted mb-2">
        {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(
          deal.amount
        )}
      </p>
      <select
        value={deal.stage}
        onChange={handleMove}
        disabled={isPending}
        className="w-full rounded-md border border-border px-2 py-1 text-xs"
      >
        {stages.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
