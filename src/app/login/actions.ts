"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/redirect";

export type LoginState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string; email?: string };

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  next: z.string().optional(),
});

// The configured site URL wins, so a forged Host header can't change where the login link points.
// Previews have no NEXT_PUBLIC_SITE_URL and fall back to their own host (Supabase's redirect allow-list still applies).
async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function requestLoginLink(_prev: LoginState, form: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({ email: form.get("email"), next: form.get("next") ?? undefined });
  if (!parsed.success) return { status: "error", message: "כתובת המייל לא נראית תקינה.", email: String(form.get("email") ?? "") };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", message: "ההתחברות עדיין לא זמינה באתר הזה." };

  const next = safeNext(parsed.data.next);
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}`, shouldCreateUser: true },
  });
  if (error) {
    const limited = error.status === 429 || /rate limit/i.test(error.message);
    return {
      status: "error",
      email: parsed.data.email,
      message: limited
        ? "נשלחו יותר מדי קישורים בזמן קצר. אפשר לנסות שוב בעוד כמה דקות."
        : "לא הצלחנו לשלוח קישור התחברות. אפשר לנסות שוב בעוד כמה דקות.",
    };
  }
  return { status: "sent", email: parsed.data.email };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/");
}
