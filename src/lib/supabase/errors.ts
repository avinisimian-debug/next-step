/**
 * Maps database and auth errors to short Hebrew messages that are safe to show.
 * Raw error text never reaches the page: it can contain table or policy names.
 */
export interface DbErrorLike {
  code?: string;
  message?: string;
}

export type UserError =
  | "rate_limit"
  | "forbidden"
  | "auth_required"
  | "duplicate"
  | "invalid"
  | "not_found"
  | "unavailable"
  | "unknown";

export const USER_ERROR_MESSAGES: Record<UserError, string> = {
  rate_limit: "הגעת למגבלת הפרסום לשעה הקרובה. אפשר לנסות שוב מאוחר יותר.",
  forbidden: "אין לך הרשאה לבצע את הפעולה הזו.",
  auth_required: "צריך להתחבר כדי לבצע את הפעולה הזו.",
  duplicate: "הפעולה הזו כבר בוצעה.",
  invalid: "חלק מהפרטים לא תקינים. כדאי לבדוק ולנסות שוב.",
  not_found: "הפריט לא נמצא. ייתכן שהוסר.",
  unavailable: "השירות לא זמין כרגע. אפשר לנסות שוב בעוד כמה דקות.",
  unknown: "משהו השתבש. אפשר לנסות שוב.",
};

export function classifyDbError(error: DbErrorLike | null | undefined): UserError | null {
  if (!error) return null;
  const msg = error.message ?? "";
  if (msg.includes("NS_RATE_LIMIT")) return "rate_limit";
  if (msg.includes("NS_FORBIDDEN")) return "forbidden";
  if (msg.includes("NS_AUTH_REQUIRED")) return "auth_required";
  switch (error.code) {
    case "42501": // insufficient privilege, including row-level security violations
      return "forbidden";
    case "23505":
      return "duplicate";
    case "23514":
    case "23502":
    case "22001":
    case "22P02":
      return "invalid";
    case "23503":
    case "PGRST116":
      return "not_found";
    case "PGRST106": // schema not exposed through the API
    case "PGRST002":
    case "PGRST000":
      return "unavailable";
  }
  if (/fetch failed|network|timeout/i.test(msg)) return "unavailable";
  return "unknown";
}

export const userErrorMessage = (error: DbErrorLike | null | undefined) => {
  const kind = classifyDbError(error);
  return kind ? USER_ERROR_MESSAGES[kind] : null;
};
