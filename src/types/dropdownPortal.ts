export interface DropdownPortalProps {
  isOpen: boolean;
  onClose: () => void;
  buttonRef: React.RefObject<any>;
  children: React.ReactNode;
  className?: string;
}