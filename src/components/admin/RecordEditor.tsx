"use client";

import { useState } from "react";
import { institutionSchema, type Institution } from "@/lib/domain/types";

export function RecordEditor({ initial }: { initial: Institution }) {
  const [text, setText] = useState(JSON.stringify(initial, null, 2));
  const [message, setMessage] = useState<{ tone: "ok" | "error" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const validate = () => {
    try {
      const parsed = institutionSchema.safeParse(JSON.parse(text));
      if (!parsed.success) {
        setMessage({ tone: "error", text: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n") });
        return null;
      }
      setMessage({ tone: "ok", text: "הרשומה תקינה." });
      return parsed.data;
    } catch {
      setMessage({ tone: "error", text: "JSON לא תקין." });
      return null;
    }
  };

  const save = async () => {
    const record = validate();
    if (!record) return;
    setBusy(true);
    const res = await fetch("/api/admin/institutions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    setBusy(false);
    setMessage({ tone: res.ok ? "ok" : "info", text: body.message ?? (res.ok ? "נשמר." : "השמירה נכשלה.") });
  };

  return (
    <div className="mt-6">
      <label htmlFor="record" className="text-sm font-semibold text-navy-950">
        רשומה (JSON)
      </label>
      <textarea
        id="record"
        dir="ltr"
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        className="mt-2 h-[60vh] w-full rounded-2xl border border-sand-300 bg-paper p-4 font-mono text-xs leading-5"
      />
      <div className="mt-4 flex gap-3">
        <button type="button" onClick={validate} className="rounded-full border border-sand-300 px-4 py-2 text-sm font-medium">
          בדיקת תקינות
        </button>
        <button type="button" onClick={save} disabled={busy} className="rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-paper disabled:opacity-50">
          שמירה
        </button>
      </div>
      {message && (
        <pre
          role="status"
          className={`mt-4 whitespace-pre-wrap rounded-xl p-4 text-sm ${message.tone === "error" ? "bg-rose-50 text-rose-700" : message.tone === "ok" ? "bg-teal-100 text-teal-700" : "bg-amber-100 text-amber-700"}`}
        >
          {message.text}
        </pre>
      )}
    </div>
  );
}
