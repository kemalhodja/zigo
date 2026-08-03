export async function cleanupUploadedMedia(objectPath?: string) {
  if (!objectPath) return;

  await fetch("/api/social/upload", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ objectPath }),
  }).catch((err) => {
    // Cleanup is best-effort; the publish error shown to the user is more important.
    console.warn("[media-cleanup] Failed to remove orphaned upload:", objectPath, err);
  });
}
