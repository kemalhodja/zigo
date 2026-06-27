export type StandardErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "SUBSCRIPTION_REQUIRED"
  | "MODERATION_BLOCKED"
  | "INTERNAL_ERROR"
  | "BAD_REQUEST"
  | string;

export type StandardErrorBody = {
  error: string;
  code: StandardErrorCode;
  retryAfterSeconds?: number;
  details?: unknown;
};

export type StandardErrorResult = {
  status: number;
  body: StandardErrorBody;
};

export type ApiSuccessBody<T> = {
  data: T;
};
