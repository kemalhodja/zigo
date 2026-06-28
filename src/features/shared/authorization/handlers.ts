import type { NextResponse } from "next/server";

import type { SupabaseClient } from "@supabase/supabase-js";

import { withApiHandler } from "@/features/shared/api/with-api-handler";
import type { UserProfile } from "@/lib/domain/profiles";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

import {
  authorizeRequest,
  isErrorResponse,
  requirePlatformAdminContext,
} from "./require";
import type { AuthContext, AuthorizeRequestOptions } from "./types";

export type AuthenticatedHandlerContext = {
  supabase: SupabaseClient<Database>;
  auth: AuthContext;
  profile: UserProfile;
};

export type AuthenticatedAdminContext = AuthenticatedHandlerContext;

export function withAuthorizedApiHandler<TContext = unknown>(
  options: AuthorizeRequestOptions,
  handler: (
    request: Request,
    context: TContext,
    authCtx: AuthenticatedHandlerContext,
  ) => Promise<NextResponse> | NextResponse,
  handlerOptions?: { fallbackMessage?: string; fallbackStatus?: number },
) {
  return withApiHandler<TContext>(async (request, context) => {
    const supabase = await createClient();
    const authOrError = await authorizeRequest(supabase, request, options);
    if (isErrorResponse(authOrError)) return authOrError;

    return handler(request, context, {
      supabase,
      auth: authOrError,
      profile: authOrError.profile,
    });
  }, handlerOptions);
}

export function withAdminApiHandler<TContext = unknown>(
  handler: (
    request: Request,
    context: TContext,
    auth: AuthenticatedAdminContext,
  ) => Promise<NextResponse> | NextResponse,
  options?: { fallbackMessage?: string; fallbackStatus?: number },
) {
  return withApiHandler<TContext>(async (request, context) => {
    const supabase = await createClient();
    const authOrError = await requirePlatformAdminContext(supabase);
    if (isErrorResponse(authOrError)) return authOrError;

    return handler(request, context, {
      supabase,
      auth: authOrError,
      profile: authOrError.profile,
    });
  }, options);
}
