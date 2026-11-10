import { redirect } from "next/navigation";

import { toPositiveInt } from "@/lib/utils";

interface MusicPlayPageProps {
  searchParams: Promise<{ id?: string | string[] }>;
}

/**
 * Legacy `/music/play?id=123` links -> canonical `/sound/123`.
 * Anything without a valid positive integer id goes back to the homepage.
 */
export default async function MusicPlayPage({ searchParams }: MusicPlayPageProps) {
  const params = await searchParams;
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = toPositiveInt(rawId);

  if (id !== null) redirect(`/sound/${id}`);
  redirect("/");
}
