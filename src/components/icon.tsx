import {
  BadgeCheck, Blocks, Briefcase, Building2, CalendarDays, CircleHelp, Clock, Eye, FileText, GraduationCap,
  History, House, KeyRound, LayoutDashboard, ListChecks, LogIn, Route, Scale, Search, ShieldCheck, Sparkles,
  Star, UserRound, Users, BriefcaseBusiness,
  type LucideIcon,
} from "lucide-react";
import type { IconName } from "./nav-items";

export const ICONS: Record<IconName, LucideIcon> = {
  home: House,
  student: GraduationCap,
  company: BriefcaseBusiness,
  skills: Blocks,
  shield: ShieldCheck,
  login: LogIn,
  dashboard: LayoutDashboard,
  user: UserRound,
  graduation: GraduationCap,
  sparkles: Sparkles,
  briefcase: Briefcase,
  calendar: CalendarDays,
  file: FileText,
  eye: Eye,
  search: Search,
  star: Star,
  check: BadgeCheck,
  users: Users,
  building: Building2,
  list: ListChecks,
  history: History,
  key: KeyRound,
  route: Route,
  help: CircleHelp,
  scale: Scale,
  clock: Clock,
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  const C = ICONS[name];
  return <C className={className} aria-hidden="true" />;
}
