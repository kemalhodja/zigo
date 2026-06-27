"use client";

import { useMutation } from "@tanstack/react-query";

import type { CreateLessonRequestBody } from "@/features/lesson/types";

type LessonRequestRow = {
  id: string;
  status: string;
};

async function postLessonRequest(body: CreateLessonRequestBody): Promise<LessonRequestRow> {
  const response = await fetch("/api/lesson-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as { data?: LessonRequestRow; error?: string; code?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "Talep kaydedilemedi.");
  }
  if (!payload.data) {
    throw new Error("Talep kaydedilemedi.");
  }
  return payload.data;
}

export function useCreateLessonRequest() {
  return useMutation({
    mutationFn: postLessonRequest,
  });
}
