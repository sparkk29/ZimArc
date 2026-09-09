"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { searchExercises } from "@/lib/exercises/catalog";

type ExercisePickerProps = {
  onSelect: (name: string) => void;
};

export default function ExercisePicker({ onSelect }: ExercisePickerProps) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchExercises(query, 8), [query]);

  return (
    <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[rgba(7,17,31,0.45)] p-3">
      <p className="wa-label mb-2">Pick from photo library</p>
      <input
        className="wa-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search squat, bench, row..."
      />
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {results.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.name)}
            className="group overflow-hidden rounded-xl border border-[var(--border)] text-left transition hover:border-[rgba(158,201,222,0.45)]"
          >
            <div className="relative h-20 w-full">
              <Image
                src={item.image}
                alt={item.imageAlt}
                fill
                sizes="160px"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-2">
              <p className="text-xs font-semibold text-[var(--frost)]">
                {item.name}
              </p>
              <p className="text-[10px] text-[var(--muted)]">{item.muscle}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
