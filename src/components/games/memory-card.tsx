"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { 
  Anchor, Atom, Bell,
Bird,   Brain,
Bug, Bus, Camera, Car, Cat, Clock, Cloud, Coffee, Compass, Cpu, Dog,
Droplet, Feather,   Fish, Flame, Gamepad2, Gem,
Ghost, Globe, Headphones,   Heart, Key, Leaf, Lock, Moon, Music,   Rocket, Smile, Snowflake, Star, Sun, Telescope, Thermometer, Umbrella,
Wind, Zap} from "lucide-react";
import { memo } from "react";

const IconComponents: Record<string, React.ElementType> = {
  Rocket, Star, Globe, Atom, Telescope, Car, Bus, Gamepad2, Cpu, Gem,
  Heart, Sun, Moon, Zap, Cloud, Music, Camera, Coffee, Headphones, Umbrella,
  Anchor, Smile, Flame, Droplet, Feather, Leaf, Bug, Ghost, Cat, Dog,
  Fish, Bird, Snowflake, Wind, Thermometer, Compass, Key, Lock, Clock, Bell
};

type MemoryCardProps = {
  id: string;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
  isError?: boolean;
  onClick: (id: string) => void;
};

export const MemoryCard = memo(function MemoryCard({
  id,
  icon,
  isFlipped,
  isMatched,
  isError = false,
  onClick,
}: MemoryCardProps) {
  const Icon = IconComponents[icon] || Brain;

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useTransform(mouseY, [0, 1], [15, -15]);
  const rotateY = useTransform(mouseX, [0, 1], [-15, 15]);

  const glareX = useTransform(mouseX, [0, 1], [100, 0]);
  const glareY = useTransform(mouseY, [0, 1], [100, 0]);

  function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (isFlipped || isMatched) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  }

  function handlePointerLeave() {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }

  return (
    <div className="relative aspect-square w-full perspective-[1000px]">
      <motion.button
        type="button"
        onClick={() => onClick(id)}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        disabled={isFlipped || isMatched}
        style={{
          rotateX: isFlipped || isMatched ? 0 : rotateX,
          rotateY: isFlipped || isMatched ? 0 : rotateY,
          transformStyle: "preserve-3d"
        }}
        className={`relative w-full h-full rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] focus:outline-none tap-scale ${
          isFlipped || isMatched ? "rotate-y-180" : ""
        } ${isMatched ? "cursor-default translate-z-[30px]" : "cursor-pointer"} ${isError ? "animate-shake" : ""}`}
      >
      {/* Arka Yüz (Kapalı) */}
      <div
        className={`absolute inset-0 flex items-center justify-center rounded-2xl backface-hidden ${
          isMatched
            ? "hidden"
            : "bg-gradient-to-br from-violet-600 to-indigo-700 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] shadow-violet-500/30 border border-violet-400/30"
        }`}
      >
        <div className="flex flex-col items-center justify-center">
          <Brain className="w-8 h-8 text-white/30" />
        </div>
      </div>

      {/* Ön Yüz (Açık) */}
      <div
        className={`absolute inset-0 flex items-center justify-center rounded-2xl backface-hidden rotate-y-180 ${
          isMatched
            ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_0_30px_rgba(52,211,153,0.6)] border-2 border-emerald-300"
            : isError
            ? "bg-red-50 shadow-md border-2 border-red-400"
            : "bg-white shadow-md border-2 border-indigo-200"
        }`}
      >
        <Icon
          className={`w-10 h-10 sm:w-12 sm:h-12 transition-all duration-300 ${
            isMatched ? "text-white drop-shadow-md scale-110" : "text-indigo-600"
          }`}
        />
        
        {/* Holografik Parlama (Glare) Yalnızca kart kapalıyken (aslında arkadayken, ama burada kart kapalıyken arka yüz gözüktüğü için) */}
        {!isFlipped && !isMatched && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none mix-blend-color-dodge opacity-60"
            style={{
              background: `radial-gradient(circle at calc(${glareX}% + 0px) calc(${glareY}% + 0px), rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)`
            }}
          />
        )}
      </div>
    </motion.button>
    </div>
  );
});
