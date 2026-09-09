export type ExerciseCatalogItem = {
  id: string;
  name: string;
  aliases: string[];
  muscle: string;
  image: string;
  imageAlt: string;
};

// Curated gym photos (Unsplash) matched by exercise name/aliases.
export const EXERCISE_CATALOG: ExerciseCatalogItem[] = [
  {
    id: "bench-press",
    name: "Bench Press",
    aliases: ["barbell bench", "flat bench", "chest press"],
    muscle: "Chest",
    image:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Person performing a bench press",
  },
  {
    id: "incline-bench",
    name: "Incline Bench Press",
    aliases: ["incline press", "incline dumbbell press"],
    muscle: "Chest",
    image:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Athlete training chest on a bench",
  },
  {
    id: "squat",
    name: "Squat",
    aliases: ["back squat", "barbell squat", "goblet squat"],
    muscle: "Legs",
    image:
      "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Athlete performing a squat",
  },
  {
    id: "deadlift",
    name: "Deadlift",
    aliases: ["conventional deadlift", "romanian deadlift", "rdl"],
    muscle: "Posterior",
    image:
      "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Athlete performing a deadlift",
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    aliases: ["pulldown", "lat pull down", "lat pull"],
    muscle: "Back",
    image:
      "https://images.unsplash.com/photo-1599058945522-28d584b6f14f?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Person using a lat pulldown machine",
  },
  {
    id: "pull-up",
    name: "Pull-Up",
    aliases: ["pullup", "chin up", "chin-up"],
    muscle: "Back",
    image:
      "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Athlete doing pull-ups",
  },
  {
    id: "barbell-row",
    name: "Barbell Row",
    aliases: ["bent over row", "pendlay row", "row"],
    muscle: "Back",
    image:
      "https://images.unsplash.com/photo-1581009146145-b5ef050c149a?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Athlete performing a barbell row",
  },
  {
    id: "overhead-press",
    name: "Overhead Press",
    aliases: ["shoulder press", "military press", "ohp", "dumbbell press"],
    muscle: "Shoulders",
    image:
      "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Athlete pressing weights overhead",
  },
  {
    id: "lateral-raise",
    name: "Lateral Raise",
    aliases: ["side raise", "dumbbell lateral raise"],
    muscle: "Shoulders",
    image:
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Person doing shoulder raises with dumbbells",
  },
  {
    id: "bicep-curl",
    name: "Bicep Curl",
    aliases: ["curl", "dumbbell curl", "barbell curl"],
    muscle: "Arms",
    image:
      "https://images.unsplash.com/photo-1583454110551-21d2be4ba1ba?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Athlete performing bicep curls",
  },
  {
    id: "tricep-pushdown",
    name: "Tricep Pushdown",
    aliases: ["pushdown", "cable pushdown", "tricep extension"],
    muscle: "Arms",
    image:
      "https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Athlete training arms with cables",
  },
  {
    id: "leg-press",
    name: "Leg Press",
    aliases: ["machine leg press"],
    muscle: "Legs",
    image:
      "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Person using a leg press machine",
  },
  {
    id: "lunges",
    name: "Lunges",
    aliases: ["walking lunge", "reverse lunge", "dumbbell lunge"],
    muscle: "Legs",
    image:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Athlete performing lunges",
  },
  {
    id: "hip-thrust",
    name: "Hip Thrust",
    aliases: ["glute bridge", "barbell hip thrust"],
    muscle: "Glutes",
    image:
      "https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Athlete performing a hip thrust",
  },
  {
    id: "plank",
    name: "Plank",
    aliases: ["front plank", "core plank"],
    muscle: "Core",
    image:
      "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Person holding a plank",
  },
  {
    id: "cable-fly",
    name: "Cable Fly",
    aliases: ["cable crossover", "chest fly", "pec fly"],
    muscle: "Chest",
    image:
      "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Athlete using cable machine for chest flies",
  },
  {
    id: "kettlebell-swing",
    name: "Kettlebell Swing",
    aliases: ["kb swing", "swing"],
    muscle: "Full body",
    image:
      "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Athlete swinging a kettlebell",
  },
  {
    id: "treadmill",
    name: "Treadmill Run",
    aliases: ["run", "cardio", "jogging"],
    muscle: "Cardio",
    image:
      "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Person running on a treadmill",
  },
];

export const DEFAULT_EXERCISE_IMAGE =
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80";

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function findExerciseByName(name: string): ExerciseCatalogItem | null {
  const query = normalize(name);
  if (!query) return null;

  let best: { item: ExerciseCatalogItem; score: number } | null = null;

  for (const item of EXERCISE_CATALOG) {
    const candidates = [item.name, ...item.aliases].map(normalize);
    for (const candidate of candidates) {
      let score = 0;
      if (query === candidate) score = 100;
      else if (query.includes(candidate) || candidate.includes(query)) score = 80;
      else {
        const qWords = query.split(" ");
        const cWords = candidate.split(" ");
        const overlap = qWords.filter((w) => cWords.includes(w)).length;
        if (overlap > 0) score = overlap * 20;
      }

      if (!best || score > best.score) {
        best = { item, score };
      }
    }
  }

  return best && best.score >= 20 ? best.item : null;
}

export function getExerciseVisual(name: string) {
  const match = findExerciseByName(name);
  return {
    name: match?.name ?? name,
    muscle: match?.muscle ?? "Custom",
    image: match?.image ?? DEFAULT_EXERCISE_IMAGE,
    imageAlt: match?.imageAlt ?? `Illustration for ${name || "exercise"}`,
    matched: Boolean(match),
  };
}

export function searchExercises(query: string, limit = 8) {
  const q = normalize(query);
  if (!q) return EXERCISE_CATALOG.slice(0, limit);

  return EXERCISE_CATALOG.filter((item) => {
    const hay = normalize([item.name, item.muscle, ...item.aliases].join(" "));
    return hay.includes(q) || q.split(" ").some((w) => hay.includes(w));
  }).slice(0, limit);
}
