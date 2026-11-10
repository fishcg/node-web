import Image from "next/image";

import { cn, initials } from "@/lib/utils";

interface UserAvatarProps {
  username: string;
  avatar?: string | null;
  /** Pixel size; kept numeric so the same component works in dense lists and heroes. */
  size?: number;
  className?: string;
}

/** Avatar with the same lavender initial fallback used across the site. */
export function UserAvatar({
  username,
  avatar,
  size = 40,
  className,
}: UserAvatarProps) {
  const style = { width: size, height: size };

  if (avatar) {
    return (
      <Image
        src={avatar}
        alt=""
        width={size}
        height={size}
        style={style}
        className={cn(
          "shrink-0 rounded-full border border-line object-cover",
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-hidden
      style={{ ...style, fontSize: Math.max(12, Math.round(size * 0.4)) }}
      className={cn(
        "grid shrink-0 place-items-center rounded-full border border-line bg-mist/12 font-serif leading-none text-mist-deep",
        className,
      )}
    >
      {initials(username)}
    </span>
  );
}
