import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/redirect";

const OTP_TYPES: EmailOtpType[] = ["magiclink", "signup", "email", "invite", "recovery", "email_change"];

/** Completes an email sign-in: exchanges the one-time code for a session cookie, then creates the profile. */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const next = safeNext(url.searchParams.get("next"));
  const fail = NextResponse.redirect(new URL(`/login?error=link&next=${encodeURIComponent(next)}`, url.origin));

  const supabase = await createSupabaseServerClient();
  if (!supabase) return fail;

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type && OTP_TYPES.includes(type)
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("missing code") };
  if (error) return fail;

  await supabase.rpc("ensure_profile", { name: "" });
  return NextResponse.redirect(new URL(next, url.origin));
}
