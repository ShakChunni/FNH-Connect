/**
 * Admission Scroll Spy Hook
 * Tracks which section is visible and handles smooth scrolling
 */

import { useState, useEffect, useCallback, RefObject } from "react";

export const useAdmissionScrollSpy = (
  sectionIds: string[],
  scrollContainerRef: RefObject<HTMLDivElement | null>,
  isOpen: boolean
) => {
  const [activeSection, setActiveSection] = useState(sectionIds[0]);
  const [userClickedSection, setUserClickedSection] = useState<string | null>(
    null
  );
  const [userClickTimeout, setUserClickTimeout] =
    useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setActiveSection(sectionIds[0]);
      return;
    }

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const observerOptions = {
      root: scrollContainer,
      rootMargin: "-30% 0px -30% 0px",
      threshold: 0.2,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      if (userClickedSection) return;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [sectionIds, isOpen, userClickedSection, scrollContainerRef]);

  const scrollToSection = useCallback(
    (sectionId: string) => {
      setActiveSection(sectionId);
      setUserClickedSection(sectionId);

      // Clear any existing timeout
      if (userClickTimeout) {
        clearTimeout(userClickTimeout);
      }

      // Reset after 1 second to allow observer to take over again
      const timeout = setTimeout(() => {
        setUserClickedSection(null);
      }, 1000);
      setUserClickTimeout(timeout);

      const element = document.getElementById(sectionId);
      const scrollContainer = scrollContainerRef.current;

      if (element && scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const scrollTop =
          scrollContainer.scrollTop +
          (elementRect.top - containerRect.top) -
          20;

        scrollContainer.scrollTo({
          top: scrollTop,
          behavior: "smooth",
        });
      }
    },
    [userClickTimeout, scrollContainerRef]
  );

  useEffect(() => {
    return () => {
      if (userClickTimeout) {
        clearTimeout(userClickTimeout);
      }
    };
  }, [userClickTimeout]);

  return { activeSection, scrollToSection };
};
