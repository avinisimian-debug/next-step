/** Tunable parameters of the matching engine. Weights are relative and need not sum to 100. */

export const COMPONENT_KEYS = [
  "pathway",
  "education",
  "development",
  "military",
  "location",
  "social",
  "practical",
] as const;
export type ComponentKey = (typeof COMPONENT_KEYS)[number];

export type Weights = Record<ComponentKey, number>;

export const DEFAULT_WEIGHTS: Weights = {
  pathway: 25,
  education: 20,
  development: 15,
  military: 15,
  location: 10,
  social: 10,
  practical: 5,
};

export const COMPONENT_LABELS: Record<ComponentKey, string> = {
  pathway: "התאמה למסלול",
  education: "לימוד ואווירה דתית",
  development: "מטרות התפתחות",
  military: "שירות וצבא",
  location: "מיקום ומגורים",
  social: "סביבה חברתית",
  practical: "שיקולים מעשיים",
};

export interface EngineConfig {
  weights: Weights;
  /** Minimum compatibility score (0–100) for an option to be recommended. */
  minScore: number;
  /** How many results to return at most. */
  maxResults: number;
  /** Points subtracted per already-chosen result from the same pathway, when the user is open to several. */
  diversityPenalty: number;
  /** Below this share of total weight answered, results are flagged as low-confidence. */
  lowCoverage: number;
}

export const DEFAULT_CONFIG: EngineConfig = {
  weights: DEFAULT_WEIGHTS,
  minScore: 55,
  maxResults: 3,
  diversityPenalty: 7,
  lowCoverage: 0.45,
};
