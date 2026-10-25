import Image from "next/image";
import type { Photo } from "@/lib/photos";

/** A credited photograph that fills its parent. The credit links to the source page with the licence. */
export function PhotoFrame({
  photo,
  sizes,
  priority = false,
  className = "",
  credit = true,
}: {
  /** No free photo yet for this pathway: a soft tint stands in, so nothing is presented as a real place. */
  photo?: Photo;
  sizes: string;
  priority?: boolean;
  className?: string;
  credit?: boolean;
}) {
  if (!photo) {
    return (
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-gradient-to-br from-[#efe2ea] via-sand-100 to-[#e3e6f2] ${className}`}
      />
    );
  }
  return (
    <>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={sizes}
        priority={priority}
        placeholder="blur"
        className={`object-cover ${className}`}
      />
      {credit && <PhotoCredit photo={photo} />}
    </>
  );
}

/** The credit badge on its own, for photos inside a link (a link cannot contain another link). */
export function PhotoCredit({ photo, className = "bottom-1.5 end-1.5" }: { photo?: Photo; className?: string }) {
  if (!photo) return null;
  return (
    <a
      href={photo.source}
      target="_blank"
      rel="noopener noreferrer"
      className={`absolute z-10 max-w-[85%] truncate rounded-md bg-black/70 px-2 py-1 text-[10px] leading-4 text-white backdrop-blur-sm hover:bg-black/85 ${className}`}
    >
      צילום: {photo.author} · {photo.license}
      <span className="sr-only"> (נפתח בלשונית חדשה)</span>
    </a>
  );
}
