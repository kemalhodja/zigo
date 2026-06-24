export type SocialMediaSceneName = "math" | "science" | "english" | "coding" | "quiz" | "profile";

type SocialMediaSceneProps = {
  scene: SocialMediaSceneName;
};

export function SocialMediaScene({ scene }: SocialMediaSceneProps) {
  const style = getSceneStyle(scene);

  return (
    <>
      <div className={`absolute inset-0 ${style.wash}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.32),transparent_15rem)]" />
      <div className="absolute -right-14 -top-10 size-44 rounded-full bg-white/18 blur-3xl" />
      <div className="absolute -bottom-16 left-0 size-56 rounded-full bg-black/18 blur-3xl" />
      <div className="absolute left-6 right-6 top-8 h-40 overflow-hidden rounded-[2rem] border border-white/20 bg-white/14 shadow-2xl backdrop-blur-sm">
        <div className={`absolute inset-0 ${style.surface}`} />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/22 to-transparent" />
      </div>
      <div className="absolute bottom-10 left-7 right-7 h-36 rounded-[2rem] border border-white/15 bg-black/16 shadow-2xl backdrop-blur">
        <div className="absolute left-5 top-5 size-14 rounded-full bg-white/50" />
        <div className="absolute bottom-5 left-5 h-3 w-32 rounded-full bg-white/45" />
        <div className="absolute bottom-10 left-5 h-3 w-20 rounded-full bg-white/28" />
        <div className={`absolute right-5 top-6 size-20 rounded-3xl ${style.object} shadow-xl`} />
      </div>
      <span className="sr-only">Photo-like {scene} learning moment</span>
    </>
  );
}

function getSceneStyle(scene: SocialMediaSceneName) {
  if (scene === "science") {
    return {
      object: "bg-emerald-200/65",
      surface: "bg-[linear-gradient(135deg,rgba(16,185,129,0.22),rgba(255,255,255,0.12))]",
      wash: "bg-emerald-950/10",
    };
  }

  if (scene === "coding") {
    return {
      object: "bg-sky-200/65",
      surface: "bg-[linear-gradient(135deg,rgba(14,165,233,0.22),rgba(15,23,42,0.18))]",
      wash: "bg-slate-950/10",
    };
  }

  if (scene === "english") {
    return {
      object: "bg-indigo-200/65",
      surface: "bg-[linear-gradient(135deg,rgba(99,102,241,0.22),rgba(255,255,255,0.14))]",
      wash: "bg-indigo-950/10",
    };
  }

  if (scene === "quiz" || scene === "profile") {
    return {
      object: "bg-pink-200/65",
      surface: "bg-[linear-gradient(135deg,rgba(236,72,153,0.22),rgba(255,255,255,0.12))]",
      wash: "bg-pink-950/10",
    };
  }

  return {
    object: "bg-violet-200/65",
    surface: "bg-[linear-gradient(135deg,rgba(124,58,237,0.22),rgba(255,255,255,0.12))]",
    wash: "bg-violet-950/10",
  };
}
