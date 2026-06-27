import { randomUUID } from "crypto";

import { cleanupUploadSchema } from "@/features/social/types";
import { isErrorResponse, jsonError, jsonSuccess, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]);
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const EXTENSION_BY_TYPE = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
]);

export const POST = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase, {
    roles: ["teacher"],
    requireVerified: true,
  });
  if (isErrorResponse(profileOrError)) return profileOrError;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonError("File is required.", 400, "VALIDATION_ERROR");
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return jsonError("Unsupported file type.", 400, "VALIDATION_ERROR");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return jsonError("Media must be 50 MB or smaller.", 400, "VALIDATION_ERROR");
  }

  const extension = EXTENSION_BY_TYPE.get(file.type) ?? "bin";
  const objectPath = `${profileOrError.id}/${randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from("social-media").upload(objectPath, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return jsonError(error.message, 400, "BAD_REQUEST");
  }

  const { data } = supabase.storage.from("social-media").getPublicUrl(objectPath);
  const mediaType = file.type.startsWith("video/") ? "video" : "image";

  return jsonSuccess({
    mediaUrl: data.publicUrl,
    mediaType,
    objectPath,
  });
}, { fallbackMessage: "Media could not be uploaded." });

export const DELETE = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase, {
    roles: ["teacher"],
    requireVerified: true,
  });
  if (isErrorResponse(profileOrError)) return profileOrError;

  const body = cleanupUploadSchema.parse(await request.json());
  if (!body.objectPath.startsWith(`${profileOrError.id}/`)) {
    return jsonError("Uploaded media can be cleaned only by its owner.", 403, "FORBIDDEN");
  }

  const { error } = await supabase.storage.from("social-media").remove([body.objectPath]);
  if (error) {
    return jsonError(error.message, 400, "BAD_REQUEST");
  }

  return jsonSuccess({ cleaned: true });
}, { fallbackMessage: "Uploaded media could not be cleaned." });
