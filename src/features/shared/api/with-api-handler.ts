import type { NextResponse } from "next/server";

import { handleApiError } from "@/features/shared/errors/global-error-handler";

type ApiRouteHandler<TContext = unknown> = (
  request: Request,
  context: TContext,
) => Promise<NextResponse> | NextResponse;

type ApiHandlerOptions = {
  fallbackMessage?: string;
  fallbackStatus?: number;
};

export function withApiHandler<TContext = unknown>(
  handler: ApiRouteHandler<TContext>,
  options: ApiHandlerOptions = {},
): ApiRouteHandler<TContext> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(
        error,
        options.fallbackMessage ?? "Request failed.",
        options.fallbackStatus ?? 500,
      );
    }
  };
}
