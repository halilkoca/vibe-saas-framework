"use client";

import { useActionState, useRef, useEffect } from "react";
import { createDealAction, type CreateDealState } from "./actions";

const initialState: CreateDealState = { error: null, success: false };

export function NewDealForm() {
  const [state, formAction, pending] = useActionState(createDealAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state?.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-white border border-border rounded-xl p-5 flex gap-3 items-end"
    >
      <div className="flex-1">
        <label htmlFor="title" className="block text-xs font-medium text-muted mb-1">
          Fırsat başlığı *
        </label>
        <input
          id="title"
          name="title"
          required
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-accent"
          placeholder="Acme A.Ş. — yıllık paket"
        />
      </div>
      <div className="w-40">
        <label htmlFor="amount" className="block text-xs font-medium text-muted mb-1">
          Tutar (₺)
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-accent"
          placeholder="0"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-ink text-white text-sm font-medium px-4 py-2 hover:opacity-90 disabled:opacity-50 transition shrink-0"
      >
        {pending ? "Ekleniyor..." : "Ekle"}
      </button>

      {state?.error && (
        <p role="alert" className="text-sm text-red-600 absolute mt-14">
          {state.error}
        </p>
      )}
    </form>
  );
}
