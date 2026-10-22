"use client";

import { useEffect } from "react";
import type { FormState } from "@/app/account/actions";

/**
 * Splits a server action's error into a field error (shown under that field, linked to it, and focused)
 * and a form error (shown once for the whole form). `ids` maps each form field name to its element id.
 */
export function useFieldErrors(state: FormState, ids: Record<string, string>) {
  const field = state.status === "error" && state.field && state.field in ids ? state.field : undefined;
  useEffect(() => {
    if (field) document.getElementById(ids[field])?.focus();
    // ids is a literal per form; focus again only when a new error arrives
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return {
    fieldError: (name: string) => (field === name && state.status === "error" ? state.message : undefined),
    formError: state.status === "error" && !field ? state.message : undefined,
  };
}
