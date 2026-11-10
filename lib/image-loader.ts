"use client";

const OSS_HOST = "acgay.oss-cn-hangzhou.aliyuncs.com";

/**
 * next/image custom loader: OSS covers are resized server-side by Alibaba
 * Cloud OSS image processing. Local files and remote non-OSS images are used
 * as-is; the site's seed data only points at the OSS bucket.
 */
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  if (!/^https?:\/\//i.test(src)) {
    return src;
  }

  try {
    const url = new URL(src);
    if (url.hostname !== OSS_HOST) {
      return src;
    }
    url.searchParams.set(
      "x-oss-process",
      `image/resize,w_${Math.min(width, 1920)}/quality,q_${quality ?? 80}`,
    );
    return url.toString();
  } catch {
    return src;
  }
}
