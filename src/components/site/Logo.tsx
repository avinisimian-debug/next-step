import Image from "next/image";
import mark from "@/assets/brand/mark.webp";

/** The mark: a student walking toward a lit doorway, with paths branching off. Cropped from the brand artwork. */
export function LogoMark({ className = "size-11" }: { className?: string }) {
  return <Image src={mark} alt="" sizes="48px" className={`${className} shrink-0 rounded-xl object-cover shadow-sm`} priority />;
}

export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const fg = tone === "dark" ? "text-navy-950" : "text-paper";
  // The brand blue from the artwork; the darker pair keeps "הבא" readable on the light header.
  const blue = tone === "dark" ? "from-[#1677e8] to-[#0a56c2]" : "from-[#3fd0ff] to-[#1a8cff]";
  return (
    <span className={`inline-flex items-center gap-2.5 ${fg}`}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="text-[21px] font-extrabold tracking-tight">
          הצעד <span className={`bg-gradient-to-l ${blue} bg-clip-text text-transparent`}>הבא</span>
        </span>
        <span className={`mt-1 text-[11px] font-medium ${tone === "dark" ? "text-mist-500" : "text-mist-300"}`}>גלה מה מתאים לך אחרי י״ב</span>
      </span>
    </span>
  );
}
