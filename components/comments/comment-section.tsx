"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Loader2, MessageCircle, Send } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  createCommentAction,
  loadMoreCommentsAction,
  toggleCommentLikeAction,
} from "@/lib/actions/comments";
import type { CommentItem, SessionUser } from "@/lib/types";
import { cn, formatMetric, initials } from "@/lib/utils";

interface CommentSectionProps {
  soundId: number;
  initialItems: CommentItem[];
  initialCursor: number | null;
  initialCount: number;
  viewer: SessionUser | null;
  onCountChange?: (count: number) => void;
}

function formatCommentTime(value: string): string {
  const text = String(value);
  if (text.length >= 16) {
    return `${text.slice(0, 10).replaceAll("-", ".")} ${text.slice(11, 16)}`;
  }
  return text;
}

export function CommentSection({
  soundId,
  initialItems,
  initialCursor,
  initialCount,
  viewer,
  onCountChange,
}: CommentSectionProps) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [count, setCount] = useState(initialCount);
  const [body, setBody] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [pendingLikes, setPendingLikes] = useState<Set<number>>(new Set());
  const [state, formAction, pending] = useActionState(createCommentAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const lastAddedId = useRef<number | null>(null);

  useEffect(() => {
    const comment = state.comment;
    if (!comment || comment.id === lastAddedId.current) return;
    lastAddedId.current = comment.id;
    setItems((prev) => (prev.some((item) => item.id === comment.id) ? prev : [comment, ...prev]));
    const nextCount = count + 1;
    setCount(nextCount);
    onCountChange?.(nextCount);
    setBody("");
    formRef.current?.reset();
    // count/onCountChange are intentionally read once when a new comment arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.comment]);

  async function handleLike(comment: CommentItem) {
    if (!viewer) return;
    if (pendingLikes.has(comment.id)) return;

    const previous = { likedByMe: comment.likedByMe, likeCount: comment.likeCount };
    const nextLiked = !comment.likedByMe;

    setPendingLikes((prev) => new Set(prev).add(comment.id));
    setItems((prev) =>
      prev.map((item) =>
        item.id === comment.id
          ? {
              ...item,
              likedByMe: nextLiked,
              likeCount: Math.max(0, item.likeCount + (nextLiked ? 1 : -1)),
            }
          : item,
      ),
    );

    try {
      const result = await toggleCommentLikeAction(comment.id);
      if (result.ok) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === comment.id
              ? { ...item, likedByMe: result.liked, likeCount: result.likeCount }
              : item,
          ),
        );
      } else {
        setItems((prev) =>
          prev.map((item) => (item.id === comment.id ? { ...item, ...previous } : item)),
        );
        toast.error(result.reason === "auth" ? "请先登录再点赞" : "点赞失败，请稍后再试");
      }
    } catch {
      setItems((prev) =>
        prev.map((item) => (item.id === comment.id ? { ...item, ...previous } : item)),
      );
      toast.error("点赞失败，请稍后再试");
    } finally {
      setPendingLikes((prev) => {
        const next = new Set(prev);
        next.delete(comment.id);
        return next;
      });
    }
  }

  async function handleLoadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await loadMoreCommentsAction(soundId, cursor);
      if (result.ok) {
        setItems((prev) => [...prev, ...result.page.items]);
        setCursor(result.page.nextCursor);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("加载失败，请稍后再试");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <section id="comments" className="mt-14 border-t border-white/10 pt-9 md:mt-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.24em] text-[#ff9a86] uppercase">
            Listener notes
          </p>
          <h2 className="mt-2 font-serif text-2xl text-white/90 md:text-3xl">
            评论
            <span className="ml-2 align-middle font-sans text-sm tracking-normal text-white/35">
              共 {formatMetric(count)} 条
            </span>
          </h2>
        </div>
        <MessageCircle aria-hidden="true" className="size-5 text-white/25" />
      </div>

      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="order-2 min-w-0 lg:order-1">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/12 px-5 py-10 text-center">
              <p className="text-sm text-white/60">还没有评论，来写下第一条吧。</p>
              <p className="mt-2 text-xs text-white/30">你的留言会出现在这里，所有人可见。</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {items.map((comment) => {
                const pendingLike = pendingLikes.has(comment.id);
                return (
                  <li key={comment.id} className="flex gap-3 py-5 first:pt-0">
                    <Link
                      href={`/u/${comment.author.id}`}
                      className="relative size-9 shrink-0 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10"
                      aria-label={`${comment.author.username} 的主页`}
                    >
                      {comment.author.avatar ? (
                        <Image
                          src={comment.author.avatar}
                          alt=""
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center text-xs text-white/55">
                          {initials(comment.author.username)}
                        </span>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Link
                          href={`/u/${comment.author.id}`}
                          className="text-sm text-white/80 transition hover:text-[#ff9a86]"
                        >
                          {comment.author.username}
                        </Link>
                        {comment.author.role === "admin" ? (
                          <span className="rounded-full bg-[#ff5a3c]/15 px-1.5 py-0.5 text-[9px] text-[#ff9a86]">
                            管理员
                          </span>
                        ) : null}
                        <time className="text-[11px] text-white/30" dateTime={comment.created}>
                          {formatCommentTime(comment.created)}
                        </time>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-white/70">
                        {comment.body}
                      </p>
                    </div>

                    {viewer ? (
                      <button
                        type="button"
                        onClick={() => handleLike(comment)}
                        disabled={pendingLike}
                        aria-pressed={comment.likedByMe}
                        aria-label={comment.likedByMe ? "取消点赞" : "点赞"}
                        className={cn(
                          "mt-0.5 inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-2 text-xs transition disabled:opacity-60",
                          comment.likedByMe
                            ? "bg-[#ff5a3c]/15 text-[#ff9a86]"
                            : "text-white/35 hover:bg-white/[0.06] hover:text-white/70",
                        )}
                      >
                        <Heart
                          aria-hidden="true"
                          className={cn("size-4", comment.likedByMe && "fill-current")}
                        />
                        <span className="tabular-nums">
                          {comment.likeCount > 0 ? comment.likeCount : "赞"}
                        </span>
                      </button>
                    ) : (
                      <Link
                        href={`/login?next=/sound/${soundId}`}
                        aria-label="登录后点赞"
                        className="mt-0.5 inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-2 text-xs text-white/35 transition hover:bg-white/[0.06] hover:text-white/70"
                      >
                        <Heart aria-hidden="true" className="size-4" />
                        <span className="tabular-nums">
                          {comment.likeCount > 0 ? comment.likeCount : "赞"}
                        </span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {cursor ? (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-white/12 text-xs text-white/55 transition hover:border-white/25 hover:text-white disabled:opacity-60"
            >
              {loadingMore ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {loadingMore ? "加载中…" : "加载更多评论"}
            </button>
          ) : items.length > 0 ? (
            <p className="mt-6 text-center text-xs text-white/25">已经看到全部评论了</p>
          ) : null}
        </div>

        <div className="order-1 lg:order-2 lg:sticky lg:top-24">
          {viewer ? (
            <form
              ref={formRef}
              action={formAction}
              className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
            >
              <input type="hidden" name="soundId" value={soundId} />
              <label htmlFor={`comment-body-${soundId}`} className="text-xs text-white/50">
                写下你的评论
              </label>
              <textarea
                id={`comment-body-${soundId}`}
                name="body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="这段声音让你想到了什么？"
                className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm leading-6 text-white/80 placeholder:text-white/25 focus:border-[#ff5a3c]/60 focus:outline-none"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-[11px] text-white/25">{body.length}/1000</span>
                <button
                  type="submit"
                  disabled={pending || body.trim().length === 0}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#ff5a3c] px-4 text-xs font-medium text-white transition hover:bg-[#ff6d52] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                  {pending ? "发送中…" : "发表评论"}
                </button>
              </div>
              {state.error ? (
                <p aria-live="polite" className="mt-3 text-xs text-[#ff9a86]">
                  {state.error}
                </p>
              ) : null}
              <p className="mt-3 text-[10px] leading-5 text-white/25">
                评论会公开显示，请友善交流。
              </p>
            </form>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-center">
              <p className="font-serif text-lg text-white/80">登录后参与评论</p>
              <p className="mt-2 text-xs leading-6 text-white/40">
                点赞和留言都会保存到你的账号里。
              </p>
              <Link
                href={`/login?next=/sound/${soundId}`}
                className="mt-4 inline-flex h-9 items-center rounded-full bg-[#ff5a3c] px-4 text-xs font-medium text-white transition hover:bg-[#ff6d52]"
              >
                去登录
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
