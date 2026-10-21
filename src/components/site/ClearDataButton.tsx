"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { clearAllStored } from "@/lib/client/store";

export function ClearDataButton() {
  const [done, setDone] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => {
          clearAllStored();
          setDone(true);
        }}
        className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-5 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
      >
        <Trash2 className="size-4" aria-hidden="true" />
        מחיקת כל המידע השמור
      </button>
      <span role="status" className="text-sm text-teal-700">
        {done ? "המידע נמחק מהדפדפן הזה." : ""}
      </span>
    </div>
  );
}
