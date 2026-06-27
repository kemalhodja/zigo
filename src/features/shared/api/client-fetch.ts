import type { StandardErrorBody } from "@/features/shared/errors/types";

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  const body = (await response.json()) as T & StandardErrorBody;

  if (!response.ok) {
    throw new ApiClientError(
      body.error ?? "Request failed.",
      response.status,
      body.code ?? "BAD_REQUEST",
    );
  }

  return body;
}
