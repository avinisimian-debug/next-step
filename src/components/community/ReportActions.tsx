"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { closeReport, setContentStatus } from "@/app/community/actions";
import { Button } from "@/components/ui/ui";

export function ReportActions({
  reportId,
  targetType,
  targetId,
  targetVisible,
}: {
  reportId: string;
  targetType: "question" | "answer";
  targetId: string;
  targetVisible: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) =>
    startTransition(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) setError(res.message ?? "משהו השתבש.");
      else router.refresh();
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {targetVisible && (
        <Button
          variant="danger"
          disabled={pending}
          onClick={() =>
            run(async () => {
              const hidden = await setContentStatus(targetType, targetId, "hidden");
              return hidden.ok ? closeReport(reportId, "resolved") : hidden;
            })
          }
        >
          הסתרת התוכן וסגירה
        </Button>
      )}
      {!targetVisible && (
        <Button variant="secondary" disabled={pending} onClick={() => run(() => closeReport(reportId, "resolved"))}>
          סגירה (התוכן כבר מוסתר)
        </Button>
      )}
      <Button variant="ghost" disabled={pending} onClick={() => run(() => closeReport(reportId, "dismissed"))}>
        הדיווח לא מוצדק
      </Button>
      {error && (
        <span role="alert" className="text-sm text-rose-700">
          {error}
        </span>
      )}
    </div>
  );
}
