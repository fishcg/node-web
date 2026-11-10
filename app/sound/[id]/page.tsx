import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { SoundDetailClient } from "@/components/player/sound-detail-client";
import { SITE } from "@/lib/constants";
import { getSessionUser } from "@/lib/auth";
import {
  getFavoriteIds,
  getRelatedSounds,
  getSoundById,
} from "@/lib/queries/sounds";
import { toPositiveInt } from "@/lib/utils";

// Sound detail always reflects live DB rows + the viewer's favorites.
export const dynamic = "force-dynamic";

/** React cache dedupes the query between generateMetadata and the page. */
const getSound = cache(async (id: number) => getSoundById(id));

interface SoundPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: SoundPageProps): Promise<Metadata> {
  const { id } = await params;
  const soundId = toPositiveInt(id);
  if (soundId === null) return { title: "声音不存在" };

  const sound = await getSound(soundId);
  if (!sound) return { title: "声音不存在" };

  const title = sound.subject || "无题声音";
  const description =
    sound.summary.trim().slice(0, 160) ||
    `${sound.author || "佚名"} 的声音作品，来自 ${SITE.name}。`;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      url: `/sound/${sound.id}`,
      siteName: SITE.name,
      images: sound.photo ? [{ url: sound.photo, alt: title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: sound.photo ? [sound.photo] : undefined,
    },
  };
}

export default async function SoundPage({ params }: SoundPageProps) {
  const { id } = await params;
  const soundId = toPositiveInt(id);
  if (soundId === null) notFound();

  const [sound, user] = await Promise.all([getSound(soundId), getSessionUser()]);
  if (!sound) notFound();

  const [related, favoriteIds] = await Promise.all([
    getRelatedSounds(sound, 6),
    user ? getFavoriteIds(user.id) : Promise.resolve(new Set<number>()),
  ]);

  return (
    <SoundDetailClient
      sound={sound}
      related={related}
      initialFavorited={favoriteIds.has(sound.id)}
    />
  );
}
