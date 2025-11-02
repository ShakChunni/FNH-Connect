import { RefObject, useEffect, useState } from 'react';

export const useDynamicDropdownPosition = (
  isOpen: boolean,
  buttonRef: RefObject<HTMLElement | null>,
  dropdownRef: RefObject<HTMLElement | null>,
  onClose: () => void
) => {
  const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({
    // Start with opacity 0 to prevent flicker
    opacity: 0,
  });
  const [animationDirection, setAnimationDirection] = useState<'up' | 'down'>('down');

  useEffect(() => {
    if (!isOpen) {
      // Reset to initial state when closed to avoid showing old position on reopen
      setPositionStyle({ opacity: 0 });
      return;
    }

    const updatePosition = () => {
      if (!buttonRef.current || !dropdownRef.current) return;

      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = dropdownRef.current.offsetHeight;

      if (dropdownHeight === 0) return;

      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const verticalOffset = 8;

      let top, left, width;
      left = buttonRect.left + window.scrollX;
      width = buttonRect.width;

      if (spaceBelow >= dropdownHeight) {
        top = buttonRect.bottom + window.scrollY + verticalOffset;
        setAnimationDirection('down');
      } else {
        top = buttonRect.top + window.scrollY - dropdownHeight - verticalOffset;
        setAnimationDirection('up');
      }

      setPositionStyle({
        position: 'absolute' as const,
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        zIndex: 9999,
        opacity: 1,
      });
    };

    const observer = new ResizeObserver(updatePosition);
    if (dropdownRef.current) {
      observer.observe(dropdownRef.current);
    }

    const handleScroll = (event: Event) => {
      if (!dropdownRef.current || dropdownRef.current.contains(event.target as Node)) {
        return;
      }
      onClose();
    };

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      if (dropdownRef.current) {
        observer.unobserve(dropdownRef.current);
      }
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, buttonRef, dropdownRef, onClose]);

  return { positionStyle, animationDirection };
};
