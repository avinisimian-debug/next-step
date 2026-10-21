import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

const req = (auth?: string) =>
  new NextRequest("http://localhost/admin", { headers: auth ? { authorization: auth } : {} });
const basic = (u: string, p: string) => `Basic ${btoa(`${u}:${p}`)}`;

afterEach(() => vi.unstubAllEnvs());

describe("admin middleware", () => {
  it("hides the admin area when no credentials are configured", () => {
    vi.stubEnv("ADMIN_USER", "");
    vi.stubEnv("ADMIN_PASSWORD", "");
    expect(middleware(req(basic("a", "b"))).status).toBe(404);
  });

  describe("with credentials configured", () => {
    const configure = () => {
      vi.stubEnv("ADMIN_USER", "editor");
      vi.stubEnv("ADMIN_PASSWORD", "s3cret:with:colons");
    };

    it("challenges requests without credentials", () => {
      configure();
      const res = middleware(req());
      expect(res.status).toBe(401);
      expect(res.headers.get("www-authenticate")).toMatch(/^Basic/);
    });

    it("rejects wrong credentials", () => {
      configure();
      expect(middleware(req(basic("editor", "wrong"))).status).toBe(401);
      expect(middleware(req(basic("someone", "s3cret:with:colons"))).status).toBe(401);
      expect(middleware(req("Bearer token")).status).toBe(401);
    });

    it("lets correct credentials through", () => {
      configure();
      const res = middleware(req(basic("editor", "s3cret:with:colons")));
      expect(res.status).toBe(200);
      expect(res.headers.get("x-middleware-next")).toBe("1");
    });
  });
});
