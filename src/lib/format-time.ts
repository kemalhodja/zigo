export function formatFeedTimestamp(createdAt?: string | null) {
  if (!createdAt) return "Just now";

  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return "Just now";

  const diffMs = Date.now() - created.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return created.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
