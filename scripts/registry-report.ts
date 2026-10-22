// Builds the coverage report and the registry SQL from data/registry/*.json.
// Run: npm run registry:report   (writes docs/coverage-report.md and supabase/registry-entries.sql)
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { institutions } from "@/data/institutions";
import { institutionSchema } from "@/lib/domain/types";
import { PATHWAY_INFO, PATHWAY_ORDER } from "@/lib/domain/pathways";
import { coreName, matchEntry, summarize, type MatchResult, type RegistryFile } from "@/lib/registry/match";

const root = path.resolve(__dirname, "..");
const readJson = <T>(p: string) => JSON.parse(readFileSync(path.join(root, p), "utf8")) as T;

const catalog = institutions.map((i) => institutionSchema.parse(i));
const published = catalog.filter((i) => i.published);
const registries = [
  readJson<RegistryFile>("data/registry/hesder-association.json"),
  readJson<RegistryFile>("data/registry/mechinot-gov.json"),
];
const { references } = readJson<{
  references: { category: string; label: string; source_url: string | null; status: string; reason: string }[];
}>("data/registry/references.json");

const name = (id: string) => catalog.find((i) => i.id === id)?.name ?? id;
const STATUS_HE = { matched: "הותאם", ambiguous: "דורש בדיקה", unresolved: "לא במאגר" } as const;

const lines: string[] = [];
const out = (s = "") => lines.push(s);
out("# NEXT STEP — institution coverage report");
out();
out(`Generated from \`data/registry/\` by \`npm run registry:report\`. Catalog: ${published.length} published records (${catalog.length} total).`);
out();
out("**This catalog does not cover every institution in Israel.** The numbers below measure it against the reference lists we could load, and say where no reference list exists.");
out();
out("## Summary by category");
out();
out("| Category | Reference list | In reference | Matched in catalog | Needs review | Not in catalog | Catalog records not in the list |");
out("|---|---|---|---|---|---|---|");

const allResults: { file: RegistryFile; results: MatchResult[] }[] = [];
for (const p of PATHWAY_ORDER) {
  const file = registries.find((r) => r.category === p);
  if (file) {
    const results = file.entries.map((e) => matchEntry(e, catalog, file.category));
    allResults.push({ file, results });
    const s = summarize(file, results, published);
    out(
      `| ${PATHWAY_INFO[p].name} | [${file.label}](${file.source_url}) (${file.retrieved_on}) | ${s.referenceCount} | ${s.matched} | ${s.ambiguous} | ${s.unresolved} | ${s.catalogNotInReference.length} |`,
    );
  } else {
    const ref = references.find((r) => r.category === p);
    const src = ref?.source_url ? `[${ref.label}](${ref.source_url})` : ref?.label ?? "—";
    out(`| ${PATHWAY_INFO[p].name} | ${src} — ${ref?.status ?? "none"} | — | — | — | — | ${published.filter((i) => i.pathway === p).length} in catalog |`);
  }
}
out();

for (const { file, results } of allResults) {
  const s = summarize(file, results, published);
  out(`## ${PATHWAY_INFO[file.category].name}: ${file.label}`);
  out();
  out(`- Source: ${file.source_url}, retrieved ${file.retrieved_on}.`);
  out(`- How it was collected: ${file.method}`);
  out(`- Scope: ${file.scope_note}`);
  if (file.reference_total_claimed)
    out(
      `- Known gap in the reference itself: [${file.reference_total_claimed.label}](${file.reference_total_claimed.source_url}) states ${file.reference_total_claimed.count} institutions; this list has ${s.referenceCount}. The other ${file.reference_total_claimed.count - s.referenceCount} are not identified by any list we could load.`,
    );
  out(
    `- Coverage of this list: ${s.matched} of ${s.referenceCount} matched (${Math.round((100 * s.matched) / s.referenceCount)}%), ${s.ambiguous} need a person's review, ${s.unresolved} are not in the catalog.`,
  );
  if (s.catalogNotInReference.length)
    out(`- Catalog records in this category that the list does not include: ${s.catalogNotInReference.map(name).join("; ")}.`);
  out();
  out("| # | Name in the list | Region | Status | Catalog record |");
  out("|---|---|---|---|---|");
  results.forEach((r, n) =>
    out(`| ${n + 1} | ${r.entry.name.replace(/\|/g, "/")} | ${r.entry.region ?? "—"} | ${STATUS_HE[r.status]} | ${r.candidates.map(name).join(" / ") || "—"} |`),
  );
  out();
}

out("## Reference lists not loaded");
out();
for (const r of references) out(`- **${PATHWAY_INFO[r.category as keyof typeof PATHWAY_INFO].name}** — ${r.label}${r.source_url ? ` (${r.source_url})` : ""}: ${r.reason}`);
out();
out("## How to update");
out();
out("1. Add or refresh a file in `data/registry/` with the list's source URL, retrieval date, and how it was collected.");
out("2. Run `npm run registry:report`. It rewrites this report and `supabase/registry-entries.sql`.");
out("3. Load the SQL into the database. Entries needing review appear in the review queue at `/registry-review` for admins.");
out("4. Adding an institution to the catalog still requires verifying it against an official source; a registry entry alone is not enough.");
writeFileSync(path.join(root, "docs/coverage-report.md"), lines.join("\n") + "\n");

// SQL for next_step.registry_entries. Re-running updates match status but keeps decisions made in review.
const q = (v: string | null) => (v === null ? "null" : `'${v.replace(/'/g, "''")}'`);
const rows = allResults.flatMap(({ file, results }) =>
  results.map(
    (r) =>
      `(${q(file.registry)}, ${q(file.category)}, ${q(r.entry.name)}, ${q(coreName(r.entry.name))}, ${q(r.entry.region)}, ${q(file.source_url)}, ${q(file.retrieved_on)}, ${r.status === "matched" ? q(r.candidates[0]) : "null"}, ${q(r.status)}, ${r.candidates.length && r.status !== "matched" ? q(`candidates: ${r.candidates.join(", ")}`) : "null"})`,
  ),
);
writeFileSync(
  path.join(root, "supabase/registry-entries.sql"),
  `-- Generated by npm run registry:report. Do not edit by hand.
insert into next_step.registry_entries (registry, category, external_name, normalized_name, location, source_url, retrieved_on, matched_institution_id, status, notes) values
${rows.join(",\n")}
on conflict (registry, normalized_name) do update set
  external_name = excluded.external_name, location = excluded.location, source_url = excluded.source_url, retrieved_on = excluded.retrieved_on,
  -- keep a reviewer's decision; only refresh automatic results
  matched_institution_id = case when next_step.registry_entries.status in ('unresolved', 'ambiguous') then excluded.matched_institution_id else next_step.registry_entries.matched_institution_id end,
  status = case when next_step.registry_entries.status in ('unresolved', 'ambiguous') then excluded.status else next_step.registry_entries.status end,
  notes = coalesce(next_step.registry_entries.notes, excluded.notes),
  updated_at = now();
`,
);
console.log(`coverage report written: ${rows.length} registry rows`);
