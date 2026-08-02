export const INVITE_CODE_MIN_LENGTH = 4;
export const INVITE_CODE_MAX_LENGTH = 16;
export const DEFAULT_INVITE_MAX_USES = 25;

export function normalizeInviteCode(raw: string) {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function validateInviteCodeFormat(raw: string) {
  const code = normalizeInviteCode(raw);
  if (code.length < INVITE_CODE_MIN_LENGTH || code.length > INVITE_CODE_MAX_LENGTH) {
    return { ok: false as const, code: "", error: "INVALID_FORMAT" };
  }
  return { ok: true as const, code, error: null };
}

export function generateInviteCode(seed?: string) {
  const base = (seed ?? Math.random().toString(36).slice(2, 8)).toUpperCase();
  return normalizeInviteCode(`ZIGO${base}`).slice(0, INVITE_CODE_MAX_LENGTH);
}

export function canRedeemInvite(input: {
  ownerId: string;
  redeemerId: string;
  useCount: number;
  maxUses: number;
  isActive: boolean;
}) {
  if (!input.isActive) return { ok: false as const, error: "INACTIVE" };
  if (input.ownerId === input.redeemerId) return { ok: false as const, error: "OWN_CODE" };
  if (input.useCount >= input.maxUses) return { ok: false as const, error: "EXHAUSTED" };
  return { ok: true as const, error: null };
}
