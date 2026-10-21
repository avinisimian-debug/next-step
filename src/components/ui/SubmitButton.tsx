"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";
import { Button, type ButtonVariant } from "./ui";

/** A submit button that disables itself and announces progress while its form is pending. */
export function SubmitButton({
  pendingLabel = "שומר…",
  children,
  ...props
}: ComponentProps<"button"> & { pendingLabel?: string; variant?: ButtonVariant }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || props.disabled} aria-busy={pending} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
