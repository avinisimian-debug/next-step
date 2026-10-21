import "server-only";
import { institutions as seed } from "@/data/institutions";
import { institutionSchema, type Institution } from "@/lib/domain/types";

/**
 * Data access for the institution catalog. The matching engine never imports this —
 * pages load the catalog here and pass plain records to the engine.
 */
export interface InstitutionRepository {
  /** Records that may be shown to users: published and not unverified. */
  listPublic(): Promise<Institution[]>;
  getPublicBySlug(slug: string): Promise<Institution | null>;
  /** Every record, including drafts. Admin only. */
  listAll(): Promise<Institution[]>;
  upsert(record: Institution): Promise<void>;
}

const isPublic = (i: Institution) => i.published && i.verificationStatus !== "unverified";

function validate(records: unknown[]): Institution[] {
  return records.map((r, idx) => {
    const parsed = institutionSchema.safeParse(r);
    if (!parsed.success) {
      throw new Error(`Invalid institution record at index ${idx}: ${parsed.error.message}`);
    }
    return parsed.data;
  });
}

export class SeedRepository implements InstitutionRepository {
  private readonly records = validate(seed);
  async listPublic() {
    return this.records.filter(isPublic);
  }
  async getPublicBySlug(slug: string) {
    return this.records.find((r) => r.slug === slug && isPublic(r)) ?? null;
  }
  async listAll() {
    return this.records;
  }
  async upsert(): Promise<void> {
    throw new Error("Seed data is read-only. Configure Supabase to edit institutions from the admin area.");
  }
}

/**
 * Supabase (PostgREST) implementation without extra dependencies.
 * Table layout: see supabase/schema.sql. The full record lives in the `data` jsonb column.
 */
export class SupabaseRepository implements InstitutionRepository {
  constructor(
    private readonly url: string,
    private readonly readKey: string,
    private readonly serviceKey?: string,
  ) {}

  private async query(params: string, key = this.readKey): Promise<Institution[]> {
    const res = await fetch(`${this.url}/rest/v1/institutions?select=data&${params}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`Supabase request failed: ${res.status}`);
    const rows = (await res.json()) as { data: unknown }[];
    return validate(rows.map((r) => r.data));
  }

  async listPublic() {
    return (await this.query("published=eq.true&verification_status=neq.unverified")).filter(isPublic);
  }
  async getPublicBySlug(slug: string) {
    const rows = await this.query(`slug=eq.${encodeURIComponent(slug)}`);
    return rows.find(isPublic) ?? null;
  }
  async listAll() {
    if (!this.serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin access.");
    return this.query("order=slug", this.serviceKey);
  }
  async upsert(record: Institution) {
    if (!this.serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin writes.");
    const valid = institutionSchema.parse(record);
    const res = await fetch(`${this.url}/rest/v1/institutions`, {
      method: "POST",
      headers: {
        apikey: this.serviceKey,
        Authorization: `Bearer ${this.serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        id: valid.id,
        slug: valid.slug,
        published: valid.published,
        verification_status: valid.verificationStatus,
        last_verified: valid.lastVerified,
        data: valid,
      }),
    });
    if (!res.ok) throw new Error(`Supabase upsert failed: ${res.status}`);
  }
}

let cached: InstitutionRepository | null = null;

export function getRepository(): InstitutionRepository {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  cached = url && anon ? new SupabaseRepository(url, anon, process.env.SUPABASE_SERVICE_ROLE_KEY) : new SeedRepository();
  return cached;
}

export const dataSourceLabel = () => (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY ? "Supabase" : "seed");
