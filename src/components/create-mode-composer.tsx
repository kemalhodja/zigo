"use client";

import { useEffect, useMemo, useState } from "react";

import { SocialCreateForm } from "@/components/social-create-form";
import { StoryCreateForm } from "@/components/story-create-form";
import { useMessages } from "@/lib/i18n/locale-context";

type CreateMode = "post" | "story" | "reel";
export type ComposerArea = {
  age_group: string | null;
  area_name: string;
  id: number;
};

type CreateModeComposerProps = {
  areas: ComposerArea[];
  initialMode?: CreateMode;
  teacherCreatorPlus?: boolean;
  allowDevActivate?: boolean;
};

export function CreateModeComposer({
  areas,
  initialMode = "post",
  teacherCreatorPlus = false,
  allowDevActivate = false,
}: CreateModeComposerProps) {
  const { createComposer: c } = useMessages();
  const modes = useMemo(
    () =>
      [
        { id: "post" as const, label: c.post, helper: c.postHelper },
        { id: "story" as const, label: c.spark, helper: c.sparkHelper },
        { id: "reel" as const, label: c.micro, helper: c.microHelper },
      ] satisfies { id: CreateMode; label: string; helper: string }[],
    [c],
  );
  const [mode, setMode] = useState<CreateMode>(initialMode);
  const activeMode = modes.find((item) => item.id === mode) ?? modes[0];

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  return (
    <section className="space-y-0 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-crystal">
          {c.composerLabel.replace("{mode}", activeMode.label)}
        </p>
        <p className="mt-1 text-sm font-bold text-slate-600">{activeMode.helper}</p>
      </div>
      {mode === "story" ? (
        <StoryCreateForm areas={areas} />
      ) : (
        <SocialCreateForm
          allowDevActivate={allowDevActivate}
          areas={areas}
          forceReel={mode === "reel"}
          teacherCreatorPlus={teacherCreatorPlus}
        />
      )}
    </section>
  );
}
