import type { Emphasis, Institution, MatchingAttributes } from "./types";

/**
 * Emphases a yeshiva can say it has, in its own description of itself.
 * `adds` is how each one feeds the matching attributes: an editorial reading of the
 * institution's own words, applied only when its page stresses that point.
 */
export const EMPHASES: Record<Emphasis, { label: string; adds: Partial<Pick<MatchingAttributes, ListKeys>> }> = {
  iyun: { label: "גמרא בעיון", adds: { learningStyles: ["intensive_study"], strengths: ["torah_quality"] } },
  bekiut: { label: "בקיאות והספק", adds: { strengths: ["torah_quality"] } },
  halacha: { label: "הלכה ולימודי רבנות", adds: { strengths: ["torah_quality"] } },
  emuna: { label: "לימודי אמונה", adds: { strengths: ["spiritual_atmosphere"], development: ["torah_growth"] } },
  chassidut: { label: "חסידות ופנימיות", adds: { strengths: ["spiritual_atmosphere"], development: ["torah_growth"] } },
  rav_kook: { label: "תורת הרב קוק", adds: { strengths: ["spiritual_atmosphere"] } },
  tanach: { label: "תנ״ך", adds: { learningStyles: ["discussion"] } },
  personal: { label: "ליווי אישי של הרבנים", adds: { environmentStyles: ["mentorship"], strengths: ["personal_attention"] } },
  family: { label: "אווירה משפחתית", adds: { strengths: ["community"], development: ["social"] } },
  community: { label: "עשייה בקהילה ובעיר", adds: { serviceInterests: ["education_community"], strengths: ["community"] } },
  academic: { label: "תואר או מקצוע במקביל", adds: { strengths: ["academic_professional"], development: ["professional"] } },
  shiluvim: { label: "מסלול שילובים", adds: {} },
  army_prep: { label: "הכנה לצבא וליווי בשירות", adds: { strengths: ["military_prep"] } },
  sephardi: { label: "מסורת ספרדית", adds: {} },
  personality: { label: "בניין אישיות ומידות", adds: { development: ["clarity"] } },
  openness: { label: "פתיחות וגיוון", adds: { environmentStyles: ["freedom"] } },
  prayer: { label: "תפילה ועבודת ה׳ בשמחה", adds: { strengths: ["spiritual_atmosphere"] } },
  leadership: { label: "מנהיגות ושליחות", adds: { development: ["leadership"], strengths: ["leadership"] } },
};

type ListKeys = "learningStyles" | "strengths" | "development" | "environmentStyles" | "serviceInterests";

const union = <T,>(a: readonly T[], b: readonly T[] = []) => [...new Set([...a, ...b])];

/**
 * Applies an institution's self-description: its emphases sharpen the matching attributes, and a
 * directory record (no researched highlights, only a generic sentence) gets the self-description as its short text.
 */
export function withSelfDescription(inst: Institution): Institution {
  const self = inst.selfDescription;
  if (!self) return inst;
  const attributes = { ...inst.attributes };
  for (const e of self.emphases) {
    const adds = EMPHASES[e].adds;
    for (const k of Object.keys(adds) as ListKeys[]) {
      (attributes[k] as string[]) = union(attributes[k] as string[], adds[k] as string[]);
    }
  }
  return {
    ...inst,
    attributes,
    shortDescription: inst.highlights.length > 0 ? inst.shortDescription : self.summary,
    // The directory overview says nothing is known about the educational approach; the self-description now covers it.
    profile: { ...inst.profile, overview: inst.profile.overview.replace("על הגישה החינוכית, ", "") },
    sources: inst.sources.some((s) => s.url === self.source.url) ? inst.sources : [...inst.sources, self.source],
  };
}

export const emphasisLabels = (inst: Institution) => (inst.selfDescription?.emphases ?? []).map((e) => EMPHASES[e].label);
