import { z } from "zod";
import { PATHWAYS } from "@/lib/domain/types";

/**
 * Input validation for everything users write. The database enforces the same limits;
 * validating here gives clear messages before a round-trip.
 */

const text = (min: number, max: number, tooShort: string, tooLong: string) =>
  z.string().trim().min(min, tooShort).max(max, tooLong);

export const stepSchema = z.object({
  title: text(1, 200, "צריך לכתוב מה הצעד.", "הכותרת יכולה להכיל עד 200 תווים."),
  detail: z.string().trim().max(1000, "הפירוט יכול להכיל עד 1000 תווים.").optional().transform((v) => v || null),
  institution_id: z.string().max(100).optional().transform((v) => v || null),
  due_date: z
    .string()
    .optional()
    .transform((v) => v || null)
    .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "התאריך לא תקין."),
});

export const STEP_STATUSES = ["todo", "doing", "done"] as const;
export const stepStatusSchema = z.enum(STEP_STATUSES);

export const importedStepsSchema = z
  .array(
    z.object({
      title: z.string().trim().min(1).max(200),
      detail: z.string().trim().max(1000).nullable(),
      institution_id: z.string().max(100).nullable(),
    }),
  )
  .min(1)
  .max(40);

export const questionSchema = z.object({
  title: text(8, 160, "הכותרת קצרה מדי (לפחות 8 תווים).", "הכותרת ארוכה מדי (עד 160 תווים)."),
  body: text(10, 4000, "כדאי לפרט קצת יותר (לפחות 10 תווים).", "השאלה ארוכה מדי (עד 4000 תווים)."),
  institution_id: z.string().max(100).optional().transform((v) => v || null),
  pathway: z
    .enum(PATHWAYS)
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
});

export const answerSchema = z.object({
  question_id: z.string().uuid(),
  body: text(2, 4000, "התשובה קצרה מדי.", "התשובה ארוכה מדי (עד 4000 תווים)."),
  official: z.boolean().default(false),
});

export const reportSchema = z.object({
  target_type: z.enum(["question", "answer"]),
  target_id: z.string().uuid(),
  reason: z.enum(["spam", "abuse", "misinformation", "privacy", "other"]),
  details: z.string().trim().max(1000, "הפירוט יכול להכיל עד 1000 תווים.").optional().transform((v) => v || null),
});

export const firstIssue = (e: z.ZodError) => e.issues[0]?.message ?? "חלק מהפרטים לא תקינים.";
