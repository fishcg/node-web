"use client";

import { Heart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleFavoriteAction } from "@/lib/actions/favorites";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  musicId: number;
  initialFavorited: boolean;
  className?: string;
  size?: "sm" | "md";
}

const SIZES = {
  sm: { button: "size-8", icon: "size-4" },
  md: { button: "size-10", icon: "size-[18px]" },
} as const;

/**
 * Optimistic favorite toggle. Clicking while logged out bounces to
 * `/login?next=<current path>` so the flow survives the auth round-trip.
 */
export function FavoriteButton({
  musicId,
  initialFavorited,
  className,
  size = "md",
}: FavoriteButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();
  const sizing = SIZES[size];

  function handleClick() {
    if (pending) return;

    const next = !favorited;
    setFavorited(next);

    startTransition(async () => {
      try {
        const result = await toggleFavoriteAction(musicId);

        if (!result.ok) {
          setFavorited(!next);

          if (result.reason === "auth") {
            toast("登录之后才能收藏", {
              description: "登录成功会回到这一页",
            });
            router.push(`/login?next=${encodeURIComponent(pathname || "/")}`);
            return;
          }

          toast.error("收藏没有存上，请再试一次");
          return;
        }

        setFavorited(result.favorited);
        toast.success(result.favorited ? "已收进收藏夹" : "已从收藏夹移除", {
          duration: 1600,
        });
      } catch {
        setFavorited(!next);
        toast.error("网络好像断了一下，请再试一次");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={favorited}
      aria-label={favorited ? "取消收藏" : "收藏"}
      title={favorited ? "取消收藏" : "收藏"}
      className={cn(
        "inline-flex items-center justify-center rounded-full border backdrop-blur-md transition duration-300",
        sizing.button,
        favorited
          ? "border-coral/40 bg-coral/15 text-coral"
          : "border-white/40 bg-paper/70 text-ink-soft hover:border-coral/40 hover:bg-paper hover:text-coral",
        pending && "opacity-70",
        className,
      )}
    >
      <Heart
        className={cn(
          sizing.icon,
          "transition-transform duration-300",
          favorited ? "scale-105 fill-current" : "fill-transparent",
        )}
        strokeWidth={favorited ? 1.6 : 1.8}
        aria-hidden
      />
    </button>
  );
}
