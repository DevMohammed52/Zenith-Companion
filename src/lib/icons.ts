import type { ComponentType, SVGProps } from "react";
import {
  House,
  LayoutDashboard,
  Settings,
  Search,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  User,
  Users,
  Swords,
  Skull,
  Key,
  Castle,
  FlaskConical,
  Hammer,
  Anvil,
  TrendingUp,
  CloudSun,
  Warehouse,
  PawPrint,
  Landmark,
  Shield,
  BookOpen,
  Package,
  Compass,
  Coins,
  Sparkles,
  Clock,
  Bookmark,
  Lock,
  Unlock,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  RefreshCw,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  Pencil,
  Check,
  Plus,
  Minus,
  Info,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  SearchX,
  Inbox,
  WifiOff,
  Target,
  Calculator,
  Wand2,
  ShieldCheck,
  Zap,
  Heart,
  Eye,
  EyeOff,
  Sun,
  Cloud,
  CloudRain,
  CloudFog,
  CloudLightning,
  Wind,
  CloudSnow,
  ThermometerSun,
  Trophy,
  Calendar,
  Scale,
  Sword,
  Feather,
  Crosshair,
  BatteryCharging,
  Flame,
  Percent,
  Route,
  MapPin,
} from "lucide-react";

/**
 * Zenith Companion Centralized Icon Registry
 *
 * Rules (codified from NN/g, Apple HIG, M3, Carbon, Atlassian, Polaris, Fluent 2, Lucide, WCAG 2.2):
 * 1. One icon, one meaning. Never reuse an icon for a different concept.
 * 2. Pick icons by searching Lucide's functional tags, not by visual aesthetics.
 * 3. Decorative icons like sparkles do not belong on functional controls.
 * 4. Icon-only buttons must have an accessible name (via aria-label or .sr-only span).
 * 5. Outlined by default, filled only for selected states or high-emphasis navigation.
 */

export const CONCEPT_ICONS = {
  // Navigation & Shell
  home: House,
  dashboard: LayoutDashboard,
  settings: Settings,
  search: Search,
  menu: Menu,
  close: X,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  externalLink: ExternalLink,
  profile: User,
  profileSwitch: Users,

  // Game Systems & Routes
  combat: Swords,
  boss: Skull,
  dungeon: Castle,
  key: Key,
  alchemy: FlaskConical,
  forge: Anvil,
  skillProfit: TrendingUp,
  weather: CloudSun,
  weatherClear: Sun,
  weatherOvercast: Cloud,
  weatherRain: CloudRain,
  weatherFog: CloudFog,
  weatherStorm: CloudLightning,
  weatherMagicStorm: Trophy,
  weatherWindy: Wind,
  weatherSnow: CloudSnow,
  weatherHeatwave: ThermometerSun,
  calendar: Calendar,
  housing: Warehouse,
  pets: PawPrint,
  petsOwned: Heart,
  petCompare: Scale,
  museum: Landmark,
  conquest: Shield,
  lore: BookOpen,
  items: Package,
  guilds: Users,
  map: Compass,
  mapPin: MapPin,
  bank: Landmark,
  route: Route,
  bis: Target,
  calculator: Calculator,

  // Combat Stats & Attributes
  magic: Wand2,
  defense: ShieldCheck,
  speed: Zap, // Strictly combat attack speed / haste, NOT for generic button flair
  health: Heart,
  attackPower: Sword,
  agility: Feather,
  accuracy: Crosshair,
  stamina: BatteryCharging,
  critDamage: Flame,
  critChance: Percent,

  // Game Economy & Progression
  gold: Coins,
  xp: Sparkles, // Strictly experience points / essence tiers, NOT for generic UI actions
  timer: Clock,
  favorite: Bookmark,
  locked: Lock,
  unlocked: Unlock,

  // Common UI Actions & Controls
  filter: SlidersHorizontal,
  sort: ArrowUpDown,
  sortAsc: ArrowUp,
  sortDesc: ArrowDown,
  copy: Copy,
  refresh: RefreshCw,
  download: Download,
  upload: Upload,
  trash: Trash2,
  edit: Pencil,
  check: Check,
  undo: RotateCcw,
  plus: Plus,
  minus: Minus,
  view: Eye,
  hide: EyeOff,

  // Feedback & Status
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  help: HelpCircle,
  searchEmpty: SearchX,
  emptyInbox: Inbox,
  offline: WifiOff,
} as const;

export type IconConcept = keyof typeof CONCEPT_ICONS;

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

export const ICON_SIZES: Record<IconSize, number> = {
  xs: 12, // Small contained badges, validation chevrons (Atlassian/Fluent standard)
  sm: 14, // Compact table cells, inline metadata
  md: 16, // Default baseline for body text & standard controls (Carbon/Atlassian/Polaris standard)
  lg: 20, // Primary buttons, subheaders, mobile dock items
  xl: 24, // Hero headers, drawer headings, empty state icons
};

export const DEFAULT_ICON_STROKE = 1.75;

export type LucideIconComponent = ComponentType<
  SVGProps<SVGSVGElement> & {
    size?: string | number;
    strokeWidth?: string | number;
    color?: string;
  }
>;

export function getConceptIcon(concept: IconConcept): LucideIconComponent {
  return CONCEPT_ICONS[concept] as unknown as LucideIconComponent;
}
