"use client";

import Image from "next/image";
import { getExerciseVisual } from "@/lib/exercises/catalog";

type ExerciseMediaProps = {
  name: string;
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
  showMeta?: boolean;
};

const SIZE_MAP = {
  sm: "h-14 w-14",
  md: "h-20 w-20",
  lg: "h-28 w-28",
  hero: "h-40 w-full sm:h-48",
};

export default function ExerciseMedia({
  name,
  size = "md",
  className = "",
  showMeta = false,
}: ExerciseMediaProps) {
  const visual = getExerciseVisual(name);
  const isHero = size === "hero";

  return (
    <div className={`overflow-hidden ${isHero ? "" : "rounded-2xl"} ${className}`}>
      <div
        className={`relative ${SIZE_MAP[size]} ${isHero ? "" : "shrink-0"} overflow-hidden ${isHero ? "" : "rounded-2xl"} border border-[var(--border)] bg-[var(--card-solid)]`}
      >
        <Image
          src={visual.image}
          alt={visual.imageAlt}
          fill
          sizes={
            isHero
              ? "(max-width: 768px) 100vw, 480px"
              : size === "lg"
                ? "112px"
                : size === "md"
                  ? "80px"
                  : "56px"
          }
          className="object-cover transition duration-500 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07111f]/75 via-transparent to-transparent" />
        {showMeta ? (
          <div className="absolute bottom-2 left-2 right-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ice)]">
              {visual.muscle}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
