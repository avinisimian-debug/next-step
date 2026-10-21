import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, PlugZap } from "lucide-react";

/** Shared building blocks so new screens look and behave like the rest of the site. */

const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";
export const buttonStyles = {
  primary: `${buttonBase} bg-navy-900 text-paper hover:bg-navy-800`,
  secondary: `${buttonBase} border border-navy-900 text-navy-900 hover:bg-sand-100`,
  ghost: `${buttonBase} text-navy-800 hover:bg-sand-100`,
  danger: `${buttonBase} border border-rose-700 text-rose-700 hover:bg-rose-50`,
} as const;
export type ButtonVariant = keyof typeof buttonStyles;

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button {...props} className={`${buttonStyles[variant]} ${className}`} />;
}

export function ButtonLink({ variant = "primary", className = "", ...props }: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return <Link {...props} className={`${buttonStyles[variant]} ${className}`} />;
}

export const inputStyles =
  "w-full rounded-2xl border border-sand-300 bg-paper px-4 py-3 text-navy-950 placeholder:text-stone-600/70 aria-[invalid=true]:border-rose-700";

export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-navy-900">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs leading-5 text-stone-600">
          {hint}
        </p>
      )}
      <div className="mt-2">{children}</div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}

const noticeTone = {
  info: { box: "border-mist-300 bg-mist-100 text-navy-900", Icon: Info },
  success: { box: "border-teal-600/30 bg-teal-100 text-teal-700", Icon: CheckCircle2 },
  warning: { box: "border-amber-700/30 bg-amber-100 text-amber-700", Icon: AlertTriangle },
  error: { box: "border-rose-700/30 bg-rose-50 text-rose-700", Icon: AlertTriangle },
} as const;

export function Notice({ tone = "info", title, children }: { tone?: keyof typeof noticeTone; title?: string; children?: ReactNode }) {
  const { box, Icon } = noticeTone[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex gap-3 rounded-2xl border p-4 text-sm leading-6 ${box}`}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  );
}

/** Shown when a feature needs a service that this deployment does not have. Never pretends to work. */
export function NotConfigured({ feature }: { feature: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-sand-300 p-8 text-center">
      <PlugZap className="mx-auto size-8 text-stone-600" aria-hidden="true" />
      <p className="mt-3 font-display text-xl font-bold text-navy-950">{feature} עדיין לא זמין באתר הזה</p>
      <p className="mx-auto mt-2 max-w-lg leading-7 text-stone-600">
        האפשרות הזו דורשת חיבור למסד הנתונים, והחיבור עוד לא הוגדר. שאר האתר — השאלון, ההמלצות, ההשוואה ותוכנית הפעולה — עובד כרגיל.
      </p>
    </div>
  );
}

export function PageHeader({ title, lead, children }: { title: string; lead?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl font-bold text-navy-950">{title}</h1>
        {lead && <p className="mt-3 max-w-2xl leading-7 text-stone-600">{lead}</p>}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-sand-300 p-8 text-center">
      <p className="font-display text-xl font-bold text-navy-950">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-xl leading-7 text-stone-600">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export const card = "rounded-3xl border border-sand-200 bg-paper p-6 shadow-card";
