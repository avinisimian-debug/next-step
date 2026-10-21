// A stand-in for the Supabase API gateway: forwards /rest/v1 to a real PostgREST, and answers
// the few Auth endpoints the app calls by checking test JWTs. Test-only.
import http from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";
import { GATEWAY_PORT, JWT_SECRET, POSTGREST_PORT } from "./env.mjs";

const sent = [];

function verify(token) {
  const [h, p, s] = (token ?? "").split(".");
  if (!h || !p || !s) return null;
  const expected = createHmac("sha256", JWT_SECRET).update(`${h}.${p}`).digest();
  const given = Buffer.from(s, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  const claims = JSON.parse(Buffer.from(p, "base64url").toString());
  return claims.exp * 1000 > Date.now() ? claims : null;
}

const json = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/rest/v1/")) {
      const headers = { ...req.headers, host: `localhost:${POSTGREST_PORT}` };
      // Like the real gateway, an apikey without a user token means anonymous.
      if (!headers.authorization || !verify(headers.authorization.slice(7))) delete headers.authorization;
      const upstream = http.request(
        { port: POSTGREST_PORT, path: url.pathname.slice("/rest/v1".length) + url.search, method: req.method, headers },
        (up) => {
          res.writeHead(up.statusCode ?? 502, up.headers);
          up.pipe(res);
        },
      );
      upstream.on("error", () => json(res, 502, { message: "postgrest unavailable" }));
      req.pipe(upstream);
      return;
    }
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      if (url.pathname === "/auth/v1/user" && req.method === "GET") {
        const claims = verify(req.headers.authorization?.slice(7));
        if (!claims) return json(res, 401, { code: 401, error_code: "bad_jwt", msg: "invalid JWT" });
        return json(res, 200, {
          id: claims.sub,
          aud: "authenticated",
          role: "authenticated",
          email: claims.email,
          app_metadata: {},
          user_metadata: {},
          created_at: "2026-10-21T00:00:00Z",
        });
      }
      if (url.pathname === "/auth/v1/otp" && req.method === "POST") {
        sent.push({ ...JSON.parse(body || "{}"), redirect_to: url.searchParams.get("redirect_to") });
        return json(res, 200, {});
      }
      if (url.pathname === "/auth/v1/logout") {
        res.writeHead(204);
        return res.end();
      }
      if (url.pathname === "/__test/otp") return json(res, 200, sent);
      if (url.pathname === "/") return json(res, 200, { ok: true });
      json(res, 404, { message: "not implemented in the test gateway" });
    });
  })
  .listen(GATEWAY_PORT, () => console.log(`test gateway on ${GATEWAY_PORT}`));
