// Prints SQL that loads the seed catalog into Supabase: `npm run seed:sql > supabase/seed.sql`
import { institutions } from "@/data/institutions";

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const rows = institutions.map(
  (i) =>
    `(${q(i.id)}, ${q(i.slug)}, ${q(i.pathway)}, ${i.published}, ${q(i.verificationStatus)}, ${q(i.lastVerified)}, ${q(JSON.stringify(i))}::jsonb)`,
);
console.log(`insert into next_step.institutions (id, slug, pathway, published, verification_status, last_verified, data) values
${rows.join(",\n")}
on conflict (id) do update set slug = excluded.slug, pathway = excluded.pathway, published = excluded.published,
  verification_status = excluded.verification_status, last_verified = excluded.last_verified, data = excluded.data;`);
