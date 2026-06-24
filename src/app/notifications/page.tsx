import Link from "next/link";

import { MarkNotificationsReadButton } from "@/components/mark-notifications-read-button";
import { PushNotificationPanel } from "@/components/push-notification-panel";
import { SocialAvatar } from "@/components/social-primitives";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getNotifications, type SocialNotification } from "@/lib/domain/social";
import { getServerMessages, type Messages } from "@/lib/i18n/server";
import type { UserRole } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

function buildDemoNotifications(m: Messages) {
  const n = m.notifications;
  return [
  {
    title: n.demoLikedPost,
    detail: n.demoLikedDetail,
    time: "2m",
    action: n.watch,
    href: "/post/demo",
  },
  {
    title: n.demoFollower,
    detail: n.demoFollowerDetail,
    time: "18m",
    action: n.followBack,
    href: "/profile",
  },
  {
    title: n.demoComment,
    detail: n.demoCommentDetail,
    time: "1h",
    action: m.common.open,
    href: "/post/demo",
  },
  {
    title: n.demoReel,
    detail: n.demoReelDetail,
    time: "3h",
    action: n.watch,
    href: "/micro",
  },
  {
    title: n.demoReward,
    detail: n.demoRewardDetail,
    time: "5h",
    action: n.review,
    href: "/store",
  },
];
}

type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  action: string;
  href: string;
  isRead: boolean;
  category: "learning" | "rewards" | "safety" | "social";
};

type NotificationFilter = NotificationItem["category"] | "all" | "unread";

const NOTIFICATION_CATEGORIES = ["social", "learning", "safety", "rewards"] as const;

type NotificationsPageProps = {
  searchParams: Promise<{ filter?: string }>;
};

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const m = await getServerMessages();
  const n = m.notifications;
  const activityFilters = [
    { category: "social" as const, className: "bg-pink-50 text-berry", label: n.social },
    { category: "learning" as const, className: "bg-cyan-50 text-aqua", label: n.learning },
    { category: "safety" as const, className: "bg-violet-50 text-crystal", label: n.safety },
    { category: "rewards" as const, className: "bg-amber-50 text-orange-600", label: n.rewards },
  ];
  const params = await searchParams;
  const activeFilter = getNotificationFilter(params.filter);
  const { isSignedOut, notifications, profileRole } = await getNotificationItems();
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const filteredNotifications = filterNotifications(notifications, activeFilter);
  const categoryCounts = getActivityCategoryCounts(notifications);

  return (
    <div className="space-y-0 pb-3">
      <section className="-mx-4 flex items-center justify-between border-b border-pink-100 bg-white px-4 pb-3">
        <div>
          <h1 className="text-2xl font-black text-night">{n.title}</h1>
          <p className="mt-1 text-xs font-bold text-slate-500">{n.subtitle}</p>
        </div>
        {notifications.length > 0 ? <MarkNotificationsReadButton initialUnreadCount={unreadCount} /> : null}
      </section>
      <ActivityDigestHero
        activeFilter={activeFilter}
        messages={m}
        totalCount={notifications.length}
        unreadCount={unreadCount}
      />
      {!isSignedOut ? <PushNotificationPanel role={profileRole} /> : null}
      <section className="-mx-4 border-b border-pink-100 bg-white px-4 py-3">
        <div className="grid grid-cols-4 gap-2">
          {activityFilters.map((filter) => (
            <Link
              className={`rounded-lg px-3 py-2 text-center transition ${
                activeFilter === filter.category ? "zigo-ring-active" : ""
              } ${filter.className}`}
              href={`/notifications?filter=${filter.category}`}
              key={filter.label}
            >
              <p className="text-sm font-black">{notifications.filter((item) => item.category === filter.category).length}</p>
              <p className="mt-0.5 zigo-fit-text text-[0.65rem] font-black uppercase tracking-[0.08em]">{filter.label}</p>
            </Link>
          ))}
        </div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {[
            { href: "/notifications", label: m.common.all, value: "all" },
            { href: "/notifications?filter=unread", label: unreadCount > 0 ? `${unreadCount} ${m.common.newLabel}` : m.common.unread, value: "unread" },
          ].map((filter) => (
            <Link
              className={`tap-scale shrink-0 rounded-lg px-3 py-2 text-[0.68rem] font-black ${
                activeFilter === filter.value ? "zigo-tab-active" : "bg-slate-100 text-slate-500"
              }`}
              href={filter.href}
              key={filter.value}
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </section>

      <ActivityCategorySummary counts={categoryCounts} messages={m} />

      <section className="-mx-4 divide-y divide-slate-100 bg-white">
        {filteredNotifications.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-lg bg-gradient-to-br from-crystal via-berry to-aqua text-white">
              <svg aria-hidden="true" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
              </svg>
            </span>
            <h2 className="mt-4 text-lg font-black text-night">
              {isSignedOut ? n.signInTitle : activeFilter === "unread" ? n.noUnread : n.noActivity}
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              {isSignedOut
                ? n.signInDesc
                : activeFilter === "unread"
                  ? n.noUnreadDesc
                  : n.noActivityDesc}
            </p>
            <Link className="tap-scale mt-5 inline-flex rounded-lg bg-gradient-to-r from-crystal via-berry to-aqua px-5 py-3 text-sm font-black text-white" href={isSignedOut ? "/auth?next=/notifications" : activeFilter === "all" ? "/explore" : "/notifications"}>
              {isSignedOut ? m.common.signIn : activeFilter === "all" ? n.discoverCreators : n.showAll}
            </Link>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <Link
              className={`tap-scale flex items-center gap-3 px-4 py-3.5 ${notification.isRead ? "bg-white" : "bg-gradient-to-r from-pink-50 via-violet-50 to-cyan-50"}`}
              href={notification.href}
              key={notification.id}
            >
              <span className="relative">
                <SocialAvatar className="size-11" label={notification.title} />
                {!notification.isRead ? (
                  <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-rose-500" />
                ) : null}
              </span>
              <div className="min-w-0 flex-1 text-sm leading-5">
                <p className="text-slate-700">
                  <span className="font-black text-night">{notification.title}</span>{" "}
                  {notification.detail}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-400">{notification.time}</p>
              </div>
              <span className="rounded-lg bg-white px-3 py-2 text-xs font-black text-crystal">
                {notification.action}
              </span>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}

function ActivityDigestHero({
  activeFilter,
  messages,
  totalCount,
  unreadCount,
}: {
  activeFilter: NotificationFilter;
  messages: Messages;
  totalCount: number;
  unreadCount: number;
}) {
  const n = messages.notifications;
  return (
    <section className="-mx-4 overflow-hidden border-b border-violet-100 bg-white">
      <div className="bg-gradient-to-br from-night via-violet-900 to-crystal px-4 py-5 text-white">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/65">{n.digest}</p>
        <h2 className="mt-2 text-2xl font-black leading-tight">
          {unreadCount > 0 ? `${unreadCount} ${n.unreadAttention}.` : n.allClear}
        </h2>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <DigestStat label={n.statTotal} value={totalCount} />
          <DigestStat label={n.statUnread} value={unreadCount} />
          <DigestStat label={n.statFilter} value={activeFilter} />
        </div>
      </div>
    </section>
  );
}

function DigestStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="zigo-stat-chip rounded-xl bg-white/14 px-2 py-2 backdrop-blur">
      <p className="text-sm font-black">{value}</p>
      <p className="zigo-fit-text mt-0.5 text-[0.65rem] font-black uppercase tracking-[0.08em] text-white/75">{label}</p>
    </div>
  );
}

function ActivityCategorySummary({ counts, messages }: { counts: Record<NotificationItem["category"], number>; messages: Messages }) {
  const n = messages.notifications;
  const items = [
    { href: "/notifications?filter=social", label: n.social, value: counts.social },
    { href: "/notifications?filter=learning", label: n.learning, value: counts.learning },
    { href: "/notifications?filter=safety", label: n.safety, value: counts.safety },
    { href: "/notifications?filter=rewards", label: n.rewards, value: counts.rewards },
  ];

  return (
    <section className="-mx-4 border-b border-pink-50 bg-white px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{n.categorySummary}</p>
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
        {items.map((item) => (
          <Link
            className="tap-scale min-w-36 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-pink-50 px-3 py-3"
            href={item.href}
            key={item.label}
          >
            <p className="text-lg font-black text-night">{item.value}</p>
            <p className="zigo-fit-text mt-1 text-xs font-bold text-crystal">{item.label}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function filterNotifications(notifications: NotificationItem[], filter: NotificationFilter) {
  if (filter === "all") return notifications;
  if (filter === "unread") return notifications.filter((notification) => !notification.isRead);
  return notifications.filter((notification) => notification.category === filter);
}

function getActivityCategoryCounts(notifications: NotificationItem[]) {
  return notifications.reduce<Record<NotificationItem["category"], number>>(
    (counts, notification) => ({
      ...counts,
      [notification.category]: counts[notification.category] + 1,
    }),
    { learning: 0, rewards: 0, safety: 0, social: 0 },
  );
}

function getNotificationFilter(value?: string): NotificationFilter {
  if (value === "unread") return "unread";
  if (NOTIFICATION_CATEGORIES.includes(value as NotificationItem["category"])) return value as NotificationItem["category"];
  return "all";
}

async function getNotificationItems(): Promise<{ isSignedOut: boolean; profileRole: UserRole; notifications: NotificationItem[] }> {
  const m = await getServerMessages();

  if (!hasSupabaseEnv()) {
    return {
      isSignedOut: false,
      profileRole: "student" as const,
      notifications: buildDemoNotifications(m).map((notification) => ({
        ...notification,
        category: getNotificationCategory(notification.title, notification.detail),
        id: notification.title,
        isRead: false,
      })),
    };
  }

  const demoFallback: Awaited<ReturnType<typeof getNotificationItems>> = {
    isSignedOut: false,
    profileRole: "student" as const,
    notifications: buildDemoNotifications(m).map((notification) => ({
      ...notification,
      category: getNotificationCategory(notification.title, notification.detail),
      id: notification.title,
      isRead: false,
    })),
  };

  return withSupabaseFallback(async () => {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) return { isSignedOut: true, profileRole: "student" as const, notifications: [] };

  const notifications = await getNotifications(supabase, profile.id);
  return { isSignedOut: false, profileRole: profile.role, notifications: notifications.map((item) => toNotificationItem(item, m)) };
  }, demoFallback);
}

function toNotificationItem(notification: SocialNotification, m: Messages): NotificationItem {
  const actor = notification.actor?.full_name ?? m.common.someone;
  const isFollow = notification.kind === "follow";
  const href = isFollow && notification.actor?.id
    ? `/profile/${notification.actor.id}`
    : notification.post_id
      ? `/post/${notification.post_id}`
      : "/notifications";

  return {
    id: notification.id,
    title: `${actor} ${notification.message}`,
    detail: isFollow ? m.notifications.newFollower : m.notifications.openPost,
    time: new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
      Math.round((new Date(notification.created_at).getTime() - Date.now()) / 60000),
      "minute",
    ),
    action: isFollow ? m.common.view : m.common.open,
    category: getNotificationCategory(notification.kind, notification.message),
    href,
    isRead: notification.is_read,
  };
}

function getNotificationCategory(kindOrTitle: string, detail: string): NotificationItem["category"] {
  const value = `${kindOrTitle} ${detail}`.toLowerCase();
  if (value.includes("reward") || value.includes("store") || value.includes("coupon") || value.includes("approval")) return "rewards";
  if (value.includes("moderation") || value.includes("safety") || value.includes("report")) return "safety";
  if (value.includes("reel") || value.includes("lesson") || value.includes("quiz") || value.includes("points")) return "learning";
  return "social";
}
