export function formatFeedTimestamp(createdAt?: string | null) {
  if (!createdAt) return "Az önce";

  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return "Az önce";

  const diffMs = Date.now() - created.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  if (hours < 24) return `${hours} sa önce`;
  if (days < 7) return `${days} gün önce`;

  return created.toLocaleDateString("tr-TR", { month: "short", day: "numeric" });
}
