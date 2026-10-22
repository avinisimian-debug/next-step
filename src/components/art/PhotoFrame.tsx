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
  photo: Photo;
  sizes: string;
  priority?: boolean;
  className?: string;
  credit?: boolean;
}) {
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
export function PhotoCredit({ photo, className = "bottom-1.5 end-1.5" }: { photo: Photo; className?: string }) {
  return (
    <a
      href={photo.source}
      target="_blank"
      rel="noopener noreferrer"
      className={`absolute z-10 max-w-[85%] truncate rounded-md bg-black/45 px-1.5 py-0.5 text-[10px] leading-4 text-white/90 backdrop-blur-sm hover:bg-black/60 ${className}`}
    >
      צילום: {photo.author} · {photo.license}
    </a>
  );
}
