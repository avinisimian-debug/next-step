import { afterEach, describe, expect, it, vi } from "vitest";
import { institutions } from "@/data/institutions";
import { SeedRepository, SupabaseRepository } from "./repository";

const verified = institutions.find((i) => i.verificationStatus === "verified")!;
const hidden = institutions.find((i) => !i.published)!;

function mockFetch(body: unknown, status = 200) {
  const fn = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("SeedRepository", () => {
  it("never returns unpublished or unverified records publicly", async () => {
    const repo = new SeedRepository();
    const pub = await repo.listPublic();
    expect(pub.some((i) => !i.published || i.verificationStatus === "unverified")).toBe(false);
    expect(await repo.getPublicBySlug(hidden.slug)).toBeNull();
    expect((await repo.listAll()).length).toBe(institutions.length);
  });

  it("is read-only", async () => {
    await expect(new SeedRepository().upsert()).rejects.toThrow(/read-only/);
  });
});

describe("SupabaseRepository", () => {
  it("queries only published, non-unverified rows with the read key and filters again locally", async () => {
    const fetchFn = mockFetch([{ data: verified }, { data: hidden }]);
    const result = await new SupabaseRepository("https://db.example", "anon").listPublic();
    expect(result.map((r) => r.id)).toEqual([verified.id]);
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("published=eq.true");
    expect(url).toContain("verification_status=neq.unverified");
    expect((init.headers as Record<string, string>).apikey).toBe("anon");
    expect((init.headers as Record<string, string>)["Accept-Profile"]).toBe("next_step");
  });

  it("rejects rows that fail schema validation", async () => {
    mockFetch([{ data: { ...verified, sources: [] } }]);
    await expect(new SupabaseRepository("https://db.example", "anon").listPublic()).rejects.toThrow(/Invalid institution/);
  });

  it("surfaces HTTP errors", async () => {
    mockFetch({ message: "nope" }, 500);
    await expect(new SupabaseRepository("https://db.example", "anon").listPublic()).rejects.toThrow(/500/);
  });

  it("requires the service key for admin reads and writes", async () => {
    const repo = new SupabaseRepository("https://db.example", "anon");
    await expect(repo.listAll()).rejects.toThrow(/SERVICE_ROLE/);
    await expect(repo.upsert(verified)).rejects.toThrow(/SERVICE_ROLE/);
  });

  it("upserts a validated record with the service key", async () => {
    const fetchFn = mockFetch([], 201);
    await new SupabaseRepository("https://db.example", "anon", "service").upsert(verified);
    const [, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).apikey).toBe("service");
    expect(JSON.parse(init.body as string)).toMatchObject({ id: verified.id, verification_status: verified.verificationStatus });
  });

  it("refuses to write an invalid record", async () => {
    const fetchFn = mockFetch([], 201);
    const bad = { ...verified, lastVerified: "yesterday" };
    await expect(new SupabaseRepository("https://db.example", "anon", "service").upsert(bad)).rejects.toThrow();
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
