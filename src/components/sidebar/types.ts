<<<<<<< HEAD
=======
import type { UserRole } from "@/types/auth";

>>>>>>> a69666330f8d45dac67c77f45d357e102170bda1
export interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
<<<<<<< HEAD
=======
  roles?: UserRole[]; // Which roles can see this item
>>>>>>> a69666330f8d45dac67c77f45d357e102170bda1
}

export interface SidebarProps {
  isExpanded: boolean;
  isPinned: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onPinnedChange: (pinned: boolean) => void;
}
