"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import PageShell from "@/app/components/PageShell";
import Avatar from "@/app/components/Avatar";
import { getUserFriendRequests, acceptFriendRequest, deleteFriend } from "@/app/lib/friend";
import { deleteNotification, getNotifications, markNotificationsRead } from "@/app/lib/notification";
import Friend from "@/app/types/friend";

// ── Notification union type ───────────────────────────────────────────────────
type NotifKind = "friend_request" | "friend_accepted" | "post_like" | "comment" | "reply" | "mention" | "group_post" | "group_invite";
const KINDS: NotifKind[] = ["friend_request", "friend_accepted", "post_like", "comment", "reply", "mention", "group_post", "group_invite"];

// Shape returned by GET /notification on the backend.
type ServerNotification = {
  id: number;
  type: string;
  content: string;
  link: string;
  read: boolean;
  createdAt: string;
  actor: { id: string; userName: string; profileImg: string | null } | null;
};

type Notif = {
  id: string;
  serverId: number;
  groupLink?: string;
  kind: NotifKind;
  // Actor (person who did the action)
  actorName: string;
  actorId?: string;
  actorImg?: string;
  // Target (what was acted on)
  postId?: number;
  postTitle?: string;
  excerpt?: string; // comment content preview
  // Meta
  time: Date;
  read: boolean;
  friendMeta?: Friend;
};

function timeAgo(date: Date | string | null | undefined) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ── Icon helpers ──────────────────────────────────────────────────────────────
function KindBadge({ kind }: { kind: NotifKind }) {
  const map: Record<NotifKind, { emoji: string; bg: string }> = {
    friend_request: { emoji: "👋", bg: "#6366f1" },
    friend_accepted: { emoji: "🤝", bg: "#22c55e" },
    post_like:       { emoji: "❤️", bg: "#ef4444" },
    comment:         { emoji: "💬", bg: "#3b82f6" },
    reply:           { emoji: "↩", bg: "#0ea5e9" },
    group_invite:    { emoji: "➕", bg: "#14b8a6" },
    mention:         { emoji: "@",  bg: "#f59e0b" },
    group_post:      { emoji: "📣", bg: "#8b5cf6" },
  };
  const { emoji, bg } = map[kind] ?? { emoji: "🔔", bg: "#6b7280" };
  return (
    <span
      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
      style={{ background: bg, border: "1.5px solid var(--bg)" }}
    >
      {emoji}
    </span>
  );
}

export default function NotificationsPage() {
  const { getToken, userId } = useAuth();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "friend_request" | "mention">("all");

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const token = await getToken();
        const [data, requests] = await Promise.all([
          getNotifications(token),
          getUserFriendRequests(token).catch(() => []),
        ]);
        const pending: Friend[] = Array.isArray(requests) ? requests : [];
        const list: ServerNotification[] = Array.isArray(data?.notifications)
          ? data.notifications
          : [];
        setNotifs(
          list.map((n) => {
            const postMatch = /^\/post\/(\d+)/.exec(n.link ?? "");
            const kind = (KINDS.includes(n.type as NotifKind) ? n.type : "comment") as NotifKind;
            return {
              id: String(n.id),
              serverId: n.id,
              kind,
              actorName: n.actor?.userName ?? "Someone",
              actorId: n.actor?.id,
              actorImg: n.actor?.profileImg ?? undefined,
              postId: postMatch ? Number(postMatch[1]) : undefined,
              postTitle: kind === "group_post" ? n.content : undefined,
              excerpt: ["comment", "reply", "mention", "group_invite"].includes(kind) ? n.content : undefined,
              groupLink: kind === "group_invite" ? n.link : undefined,
              time: new Date(n.createdAt),
              read: n.read,
              friendMeta:
                kind === "friend_request"
                  ? pending.find((r) => r.otherUser?.id === n.actor?.id)
                  : undefined,
            };
          }),
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleAccept(notif: Notif) {
    if (!userId || !notif.friendMeta) return;
    try {
      const token = await getToken();
      await acceptFriendRequest({ receiverId: userId, status: "ACCEPTED" }, notif.friendMeta.id, token);
      await markNotificationsRead({ ids: [notif.serverId] }, token);
      setNotifs((prev) =>
        prev.map((n) => n.id === notif.id ? { ...n, kind: "friend_accepted" as NotifKind, read: true } : n)
      );
    } catch (e) { console.error(e); }
  }

  async function handleDecline(notif: Notif) {
    if (!notif.friendMeta) return;
    try {
      const token = await getToken();
      await deleteFriend(notif.friendMeta.id, token);
      await deleteNotification(notif.serverId, token);
    } catch {}
    setNotifs((prev) => prev.filter((n) => n.id !== notif.id));
  }

  async function markRead(notif: Notif) {
    if (notif.read) return;
    setNotifs((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n));
    try {
      await markNotificationsRead({ ids: [notif.serverId] }, await getToken());
    } catch (e) { console.error(e); }
  }

  async function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markNotificationsRead({ all: true }, await getToken());
    } catch (e) { console.error(e); }
  }

  const FILTER_TABS: { key: "all" | "friend_request" | "mention"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "friend_request", label: "Friend requests" },
    { key: "mention", label: "Mentions" },
  ];

  const visible = filter === "all" ? notifs : notifs.filter((n) => n.kind === filter);
  const unread = notifs.filter((n) => !n.read).length;

  return (
    <PageShell
      title="Notifications"
      description={unread > 0 ? `${unread} unread` : "All caught up"}
      actions={
        unread > 0 ? (
          <button onClick={markAllRead} className="text-xs hover:underline" style={{ color: "var(--primary)" }}>
            Mark all read
          </button>
        ) : undefined
      }
    >
      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-0.5" style={{ borderBottom: "1px solid var(--border)" }}>
        {FILTER_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className="px-3 py-2 text-xs font-medium border-b-2 -mb-px whitespace-nowrap transition-colors"
            style={{
              borderColor: filter === t.key ? "var(--primary)" : "transparent",
              color: filter === t.key ? "var(--primary)" : "var(--fg-muted)",
            }}
          >
            {t.label}
            {t.key !== "all" && notifs.filter((n) => n.kind === t.key && !n.read).length > 0 && (
              <span className="ml-1 text-[9px] px-1 py-0.5 rounded-full font-bold"
                style={{ background: "var(--primary)", color: "var(--primary-fg)" }}>
                {notifs.filter((n) => n.kind === t.key && !n.read).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--bg-subtle)" }} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">🔔</p>
          <p className="text-sm font-medium" style={{ color: "var(--fg-muted)" }}>
            {filter === "all" ? "No notifications yet." : `No ${filter.replace("_", " ")} notifications.`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((notif) => (
            <NotifRow
              key={notif.id}
              notif={notif}
              onRead={() => markRead(notif)}
              onAccept={() => handleAccept(notif)}
              onDecline={() => handleDecline(notif)}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}

// ── Single notification row ───────────────────────────────────────────────────
function NotifRow({
  notif,
  onRead,
  onAccept,
  onDecline,
}: {
  notif: Notif;
  onRead: () => void;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const inner = (
    <div
      onClick={onRead}
      className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-colors"
      style={{
        background: notif.read ? "var(--bg)" : "var(--primary-subtle)",
        border: `1px solid ${notif.read ? "var(--border)" : "var(--primary)"}`,
      }}
    >
      {/* Avatar / group icon */}
      <div className="relative flex-shrink-0">
        <Avatar userName={notif.actorName} profileImg={notif.actorImg} size="md" />
        <KindBadge kind={notif.kind} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: "var(--fg)" }}>
          {notif.kind === "group_post" ? (
            <>
              <span className="font-semibold">{notif.actorId ? `@${notif.actorName}` : "Someone"}</span> posted in your group
              {notif.postTitle && <span style={{ color: "var(--fg-muted)" }}> — {notif.postTitle}</span>}
            </>
          ) : notif.kind === "group_invite" ? (
            <>
              <span className="font-semibold">@{notif.actorName}</span> {notif.excerpt}
            </>
          ) : notif.kind === "reply" ? (
            <>
              <span className="font-semibold">@{notif.actorName}</span> replied to your comment
            </>
          ) : notif.kind === "post_like" ? (
            <>
              <span className="font-semibold">{notif.actorName}</span> liked your post
              {notif.postTitle && <span style={{ color: "var(--fg-muted)" }}> — {notif.postTitle}</span>}
            </>
          ) : notif.kind === "comment" ? (
            <>
              <span className="font-semibold">@{notif.actorName}</span> commented on your post
              {notif.postTitle && <span style={{ color: "var(--fg-muted)" }}> — {notif.postTitle}</span>}
            </>
          ) : notif.kind === "mention" ? (
            <>
              <span className="font-semibold">@{notif.actorName}</span> mentioned you
              {notif.postTitle && <span style={{ color: "var(--fg-muted)" }}> in {notif.postTitle}</span>}
            </>
          ) : notif.kind === "friend_accepted" ? (
            <>
              <span className="font-semibold">@{notif.actorName}</span> is now your friend
            </>
          ) : (
            <>
              <span className="font-semibold">@{notif.actorName}</span> sent you a friend request
            </>
          )}
        </p>

        {/* Comment excerpt */}
        {notif.excerpt && notif.kind !== "group_invite" && (
          <p className="text-xs mt-0.5 line-clamp-2 italic" style={{ color: "var(--fg-muted)" }}>
            &ldquo;{notif.excerpt}&rdquo;
          </p>
        )}

        <p className="text-xs mt-0.5" style={{ color: "var(--fg-subtle)" }}>
          {timeAgo(notif.time)}
        </p>

        {/* Friend request actions */}
        {notif.kind === "friend_request" && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={(e) => { e.stopPropagation(); onAccept(); }}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-90"
              style={{ background: "var(--primary)", color: "var(--primary-fg)" }}
            >
              Accept
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDecline(); }}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
              style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--fg-muted)" }}
            >
              Decline
            </button>
          </div>
        )}

        {notif.groupLink && (
          <Link
            href={notif.groupLink}
            onClick={(e) => e.stopPropagation()}
            className="inline-block text-xs mt-1.5 hover:underline"
            style={{ color: "var(--primary)" }}
          >
            View group →
          </Link>
        )}

        {/* Post link */}
        {(notif.kind === "comment" || notif.kind === "reply" || notif.kind === "post_like" || notif.kind === "mention" || notif.kind === "group_post") && notif.postId && (
          <Link
            href={`/post/${notif.postId}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-block text-xs mt-1.5 hover:underline"
            style={{ color: "var(--primary)" }}
          >
            View post →
          </Link>
        )}
      </div>

      {/* Unread dot */}
      {!notif.read && (
        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: "var(--primary)" }} />
      )}
    </div>
  );

  return inner;
}
