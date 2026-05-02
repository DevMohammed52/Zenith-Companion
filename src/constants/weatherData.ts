export interface WeatherImpact {
  skill: string;
  efficiency: number | null;
  experience: number | null;
}

export interface WeatherData {
  id: string;
  name: string;
  description: string;
  impacts: WeatherImpact[];
  magicFind?: {
    battle: number;
    dungeon: number;
    worldBoss: number;
  };
  theme: {
    primary: string;
    secondary: string;
    icon: string;
  };
}

export const WEATHER_DATA: WeatherData[] = [
  {
    id: "clear",
    name: "Clear",
    description: "Favorable weather with improved efficiency for hunting, fishing, woodcutting, and mining. No experience or magic find bonuses.",
    impacts: [
      { skill: "Hunting", efficiency: 10, experience: 0 },
      { skill: "Fishing", efficiency: 10, experience: 0 },
      { skill: "Woodcutting", efficiency: 10, experience: 0 },
      { skill: "Mining", efficiency: 5, experience: 0 },
      { skill: "Construction", efficiency: 5, experience: 0 },
    ],
    theme: { primary: "#fbbf24", secondary: "#f59e0b", icon: "sun" }
  },
  {
    id: "fog",
    name: "Fog",
    description: "Reduces efficiency for hunting, fishing, woodcutting, and mining, but grants increased experience for the affected activities.",
    impacts: [
      { skill: "Hunting", efficiency: -10, experience: 20 },
      { skill: "Fishing", efficiency: -10, experience: 20 },
      { skill: "Woodcutting", efficiency: -10, experience: 20 },
      { skill: "Mining", efficiency: -5, experience: 10 },
      { skill: "Construction", efficiency: -5, experience: 10 },
    ],
    theme: { primary: "#94a3b8", secondary: "#64748b", icon: "cloud-fog" }
  },
  {
    id: "heatwave",
    name: "Heatwave",
    description: "Significantly reduces efficiency for hunting, fishing, woodcutting, and mining, but grants increased experience for the affected activities.",
    impacts: [
      { skill: "Hunting", efficiency: -5, experience: 15 },
      { skill: "Fishing", efficiency: -15, experience: 30 },
      { skill: "Woodcutting", efficiency: -10, experience: 25 },
      { skill: "Mining", efficiency: -15, experience: 30 },
      { skill: "Construction", efficiency: -15, experience: 30 },
    ],
    theme: { primary: "#f87171", secondary: "#ef4444", icon: "thermometer-sun" }
  },
  {
    id: "magic-storm",
    name: "Magic Storm",
    description: "Rare weather that increases magic find for battles and world bosses. Does not affect standard gathering activities.",
    impacts: [],
    magicFind: {
      battle: 25,
      dungeon: 20,
      worldBoss: 20
    },
    theme: { primary: "#a78bfa", secondary: "#8b5cf6", icon: "zap" }
  },
  {
    id: "overcast",
    name: "Overcast",
    description: "Neutral weather. No bonuses or penalties applied.",
    impacts: [
      { skill: "Hunting", efficiency: 0, experience: 0 },
      { skill: "Fishing", efficiency: 0, experience: 0 },
      { skill: "Woodcutting", efficiency: 0, experience: 0 },
      { skill: "Mining", efficiency: 0, experience: 0 },
      { skill: "Construction", efficiency: 0, experience: 0 },
    ],
    theme: { primary: "#94a3b8", secondary: "#475569", icon: "cloud" }
  },
  {
    id: "rain",
    name: "Rain",
    description: "Improves fishing efficiency, but reduces woodcutting and mining efficiency. Woodcutting and mining receive increased experience.",
    impacts: [
      { skill: "Hunting", efficiency: -5, experience: 10 },
      { skill: "Fishing", efficiency: -5, experience: 10 },
      { skill: "Woodcutting", efficiency: -5, experience: 10 },
      { skill: "Mining", efficiency: -5, experience: 10 },
      { skill: "Construction", efficiency: -5, experience: 10 },
    ],
    theme: { primary: "#60a5fa", secondary: "#3b82f6", icon: "cloud-rain" }
  },
  {
    id: "snow",
    name: "Snow",
    description: "Reduces efficiency for hunting, fishing, woodcutting, and mining, but grants increased experience for the affected activities.",
    impacts: [
      { skill: "Hunting", efficiency: -10, experience: 20 },
      { skill: "Fishing", efficiency: -15, experience: 30 },
      { skill: "Woodcutting", efficiency: -15, experience: 30 },
      { skill: "Mining", efficiency: -10, experience: 20 },
      { skill: "Construction", efficiency: -10, experience: 20 },
    ],
    theme: { primary: "#e2e8f0", secondary: "#cbd5e1", icon: "cloud-snow" }
  },
  {
    id: "storm",
    name: "Storm",
    description: "Significantly reduces efficiency for hunting, fishing, woodcutting, and mining, but grants strong experience bonuses for the affected activities.",
    impacts: [
      { skill: "Hunting", efficiency: -15, experience: 35 },
      { skill: "Fishing", efficiency: -20, experience: 40 },
      { skill: "Woodcutting", efficiency: -20, experience: 40 },
      { skill: "Mining", efficiency: -10, experience: 25 },
      { skill: "Construction", efficiency: -10, experience: 25 },
    ],
    theme: { primary: "#38bdf8", secondary: "#0ea5e9", icon: "cloud-lightning" }
  },
  {
    id: "windy",
    name: "Windy",
    description: "Improves hunting efficiency, but reduces fishing and woodcutting efficiency. Fishing and woodcutting receive increased experience.",
    impacts: [
      { skill: "Hunting", efficiency: 15, experience: 0 },
      { skill: "Fishing", efficiency: -10, experience: 20 },
      { skill: "Woodcutting", efficiency: -10, experience: 25 },
      { skill: "Mining", efficiency: 0, experience: 0 },
      { skill: "Construction", efficiency: -5, experience: 10 },
    ],
    theme: { primary: "#4ade80", secondary: "#22c55e", icon: "wind" }
  }
];
