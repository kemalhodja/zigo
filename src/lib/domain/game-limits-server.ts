import { cookies } from "next/headers";

import {
  DEFAULT_GAME_LIMITS,
  type GameLimitSettings,
  settingsFromParentRow,
} from "@/lib/domain/game-limits";
import { readActiveChildProfileId } from "@/lib/server/active-child-profile";


type ParentSettingsRow = {
  daily_limit_minutes?: number | null;
  night_ban_enabled?: boolean | null;
  night_ban_start?: string | null;
  night_ban_end?: string | null;
};

import { createClient } from "@/lib/supabase/server";

/** Veli oturumunda seçili child_profile için parent_game_settings okur; yoksa varsayılan. */
export async function resolveStudentGameLimits(): Promise<GameLimitSettings> {
  const supabase = await createClient();
  const admin = supabase;
  if (!admin) return { ...DEFAULT_GAME_LIMITS };

  const cookieStore = await cookies();
  const childProfileId = readActiveChildProfileId(cookieStore);
  if (!childProfileId) return { ...DEFAULT_GAME_LIMITS };

  const { data } = await (admin as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{ data: ParentSettingsRow | null }>;
        };
      };
    };
  })
    .from("parent_game_settings")
    .select("daily_limit_minutes, night_ban_enabled, night_ban_start, night_ban_end")
    .eq("child_profile_id", childProfileId)
    .maybeSingle();

  return settingsFromParentRow(data);
}
