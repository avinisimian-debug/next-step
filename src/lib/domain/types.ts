import { z } from "zod";

/** The four primary post-high-school pathways the platform covers. */
export const PATHWAYS = ["idf", "mechina", "hesder", "yeshiva"] as const;
export type Pathway = (typeof PATHWAYS)[number];

export const REGIONS = ["north", "center", "jerusalem", "south", "judea_samaria", "nationwide"] as const;
export type Region = (typeof REGIONS)[number];

export const RELIGIOUS_ENVIRONMENTS = [
  "religious_zionist",
  "open_religious",
  "mixed_backgrounds",
  "general",
] as const;
export type ReligiousEnvironment = (typeof RELIGIOUS_ENVIRONMENTS)[number];

export const DEVELOPMENT_GOALS = [
  "independence",
  "leadership",
  "torah_growth",
  "fitness",
  "professional",
  "social",
  "clarity",
] as const;
export type DevelopmentGoal = (typeof DEVELOPMENT_GOALS)[number];

export const SERVICE_INTERESTS = [
  "combat",
  "tech_intel",
  "leadership_command",
  "education_community",
  "professional_technical",
  "other_meaningful",
] as const;
export type ServiceInterest = (typeof SERVICE_INTERESTS)[number];

export const ENVIRONMENT_STYLES = ["structure", "freedom", "mentorship", "teamwork", "challenge"] as const;
export type EnvironmentStyle = (typeof ENVIRONMENT_STYLES)[number];

export const LEARNING_STYLES = ["intensive_study", "experiential", "practical", "discussion"] as const;
export type LearningStyle = (typeof LEARNING_STYLES)[number];

export const PRIORITIES = [
  "torah_quality",
  "military_prep",
  "personal_attention",
  "leadership",
  "community",
  "location",
  "academic_professional",
  "spiritual_atmosphere",
  "alumni",
  "guidance",
] as const;
export type Priority = (typeof PRIORITIES)[number];

export const MILITARY_MODELS = [
  "direct_service", // enlisting directly into regular service
  "hesder", // hesder arrangement: yeshiva study + shortened service
  "shiluv", // combined track with longer / full service
  "pre_military", // a preparatory year before enlistment
  "individual", // arranged individually per student
  "unknown", // not stated in the sources we checked
] as const;
export type MilitaryModel = (typeof MILITARY_MODELS)[number];

export const VERIFICATION_STATUSES = ["verified", "partial", "unverified"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

const scale = z.number().int().min(0).max(4);

/**
 * Matching attributes are an editorial classification derived from the cited
 * sources. They are not claims made by the institution itself, and the UI says so.
 */
export const matchingAttributesSchema = z.object({
  torahIntensity: scale, // 0 = none, 4 = full-day central study
  militaryEmphasis: scale, // how central military preparation/service is
  militaryModel: z.enum(MILITARY_MODELS),
  /** 0 = Torah-weighted, 1 = service-weighted. Only meaningful for combined tracks. */
  torahServiceBalance: z.number().min(0).max(1).nullable(),
  religiousEnvironments: z.array(z.enum(RELIGIOUS_ENVIRONMENTS)).min(1),
  development: z.array(z.enum(DEVELOPMENT_GOALS)),
  serviceInterests: z.array(z.enum(SERVICE_INTERESTS)),
  environmentStyles: z.array(z.enum(ENVIRONMENT_STYLES)),
  learningStyles: z.array(z.enum(LEARNING_STYLES)),
  strengths: z.array(z.enum(PRIORITIES)),
  residential: z.enum(["residential", "varies"]),
  duration: z.enum(["short", "one_year", "multi_year", "varies"]),
  communitySize: z.enum(["small", "medium", "large", "varies", "unknown"]),
  /** Who the framework is open to. "unknown" never excludes anyone. */
  audience: z.enum(["men", "women", "all", "unknown"]),
});
export type MatchingAttributes = z.infer<typeof matchingAttributesSchema>;

export const sourceSchema = z.object({
  label: z.string(),
  url: z.string().url(),
  kind: z.enum(["official", "government", "encyclopedia", "directory"]),
});
export type Source = z.infer<typeof sourceSchema>;

export const contactSchema = z.object({
  phone: z.array(z.string()).default([]),
  email: z.string().email().optional(),
  address: z.string().optional(),
});

/** A section of the profile page. Every text field here must be backed by `sources`. */
export const profileSchema = z.object({
  overview: z.string(),
  philosophy: z.string().optional(),
  programStructure: z.string().optional(),
  dailyRoutine: z.string().optional(),
  militaryIntegration: z.string().optional(),
  livingArrangements: z.string().optional(),
  admissions: z.string().optional(),
  financial: z.string().optional(),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
});

export const institutionSchema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  pathway: z.enum(PATHWAYS),
  /** Short Hebrew label shown on cards, e.g. "ישיבת הסדר" or "מכינה מעורבת". */
  typeLabel: z.string(),
  /** Is this a specific institution or a pathway/track (e.g. IDF service tracks)? */
  kind: z.enum(["institution", "track"]),
  regions: z.array(z.enum(REGIONS)).min(1),
  locationLabel: z.string(),
  shortDescription: z.string().min(10),
  highlights: z.array(z.string()).default([]),
  limitations: z.array(z.string()).default([]),
  attributes: matchingAttributesSchema,
  profile: profileSchema,
  website: z.string().url().optional(),
  contact: contactSchema.optional(),
  sources: z.array(sourceSchema).min(1),
  lastVerified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  verificationStatus: z.enum(VERIFICATION_STATUSES),
  /** Human-readable explanation of what was and was not verified. */
  verificationNotes: z.string(),
  published: z.boolean(),
});
export type Institution = z.infer<typeof institutionSchema>;
