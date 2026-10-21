import { NextResponse, type NextRequest } from "next/server";

/**
 * Protects the admin area with HTTP Basic auth.
 * If ADMIN_USER / ADMIN_PASSWORD are not configured, the admin area does not exist (404).
 */
export function middleware(req: NextRequest) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;
  if (!user || !pass) return new NextResponse("Not found", { status: 404 });

  const header = req.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    const [u, ...rest] = atob(encoded).split(":");
    if (safeEqual(u, user) && safeEqual(rest.join(":"), pass)) return NextResponse.next();
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="NEXT STEP admin", charset="UTF-8"' },
  });
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
