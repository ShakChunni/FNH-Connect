import type { UserRole } from "@/types/auth";

export interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[]; // Which roles can see this item
}

export interface SidebarProps {
  isExpanded: boolean;
  isPinned: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onPinnedChange: (pinned: boolean) => void;
}
