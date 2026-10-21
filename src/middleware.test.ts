import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

const req = (auth?: string) =>
  new NextRequest("http://localhost/admin", { headers: auth ? { authorization: auth } : {} });
const basic = (u: string, p: string) => `Basic ${btoa(`${u}:${p}`)}`;

afterEach(() => vi.unstubAllEnvs());

describe("admin middleware", () => {
  it("hides the admin area when no credentials are configured", async () => {
    vi.stubEnv("ADMIN_USER", "");
    vi.stubEnv("ADMIN_PASSWORD", "");
    expect((await middleware(req(basic("a", "b")))).status).toBe(404);
  });

  describe("with credentials configured", () => {
    const configure = () => {
      vi.stubEnv("ADMIN_USER", "editor");
      vi.stubEnv("ADMIN_PASSWORD", "s3cret:with:colons");
    };

    it("challenges requests without credentials", async () => {
      configure();
      const res = await middleware(req());
      expect(res.status).toBe(401);
      expect(res.headers.get("www-authenticate")).toMatch(/^Basic/);
    });

    it("rejects wrong credentials", async () => {
      configure();
      expect((await middleware(req(basic("editor", "wrong")))).status).toBe(401);
      expect((await middleware(req(basic("someone", "s3cret:with:colons")))).status).toBe(401);
      expect((await middleware(req("Bearer token"))).status).toBe(401);
    });

    it("lets correct credentials through", async () => {
      configure();
      const res = await middleware(req(basic("editor", "s3cret:with:colons")));
      expect(res.status).toBe(200);
      expect(res.headers.get("x-middleware-next")).toBe("1");
    });
  });

  it("leaves other pages alone and does not demand admin credentials", async () => {
    vi.stubEnv("ADMIN_USER", "editor");
    vi.stubEnv("ADMIN_PASSWORD", "x");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const res = await middleware(new NextRequest("http://localhost/community"));
    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("treats /administrator-like paths as non-admin but /admin/x as admin", async () => {
    vi.stubEnv("ADMIN_USER", "");
    vi.stubEnv("ADMIN_PASSWORD", "");
    expect((await middleware(new NextRequest("http://localhost/admin/records"))).status).toBe(404);
    expect((await middleware(new NextRequest("http://localhost/api/admin/x"))).status).toBe(404);
    expect((await middleware(new NextRequest("http://localhost/administrator"))).status).toBe(200);
  });
});
