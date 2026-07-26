"use client";

import { useActionState, useRef, useEffect } from "react";
import { createLead, type CreateLeadState } from "./actions";

const initialState: CreateLeadState = { error: null, success: false };

export function NewLeadForm() {
  const [state, formAction, pending] = useActionState(createLead, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-white border border-border rounded-xl p-5 grid grid-cols-4 gap-3 items-end"
    >
      <div className="col-span-1">
        <label htmlFor="full_name" className="block text-xs font-medium text-muted mb-1">
          İsim *
        </label>
        <input
          id="full_name"
          name="full_name"
          required
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-accent"
          placeholder="Ayşe Kaya"
        />
      </div>
      <div className="col-span-1">
        <label htmlFor="email" className="block text-xs font-medium text-muted mb-1">
          E-posta
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-accent"
          placeholder="ayse@ornek.com"
        />
      </div>
      <div className="col-span-1">
        <label htmlFor="phone" className="block text-xs font-medium text-muted mb-1">
          Telefon
        </label>
        <input
          id="phone"
          name="phone"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-accent"
          placeholder="0555 000 00 00"
        />
      </div>
      <div className="col-span-1 flex gap-2">
        <div className="flex-1">
          <label htmlFor="source" className="block text-xs font-medium text-muted mb-1">
            Kaynak
          </label>
          <input
            id="source"
            name="source"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-accent"
            placeholder="Instagram"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-ink text-white text-sm font-medium px-4 py-2 hover:opacity-90 disabled:opacity-50 transition shrink-0"
        >
          {pending ? "Ekleniyor..." : "Ekle"}
        </button>
      </div>

      {state?.error && (
        <p role="alert" className="col-span-4 text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
