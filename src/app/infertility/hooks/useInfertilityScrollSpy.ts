import { useState, useEffect, useCallback } from "react";

export const useInfertilityScrollSpy = (
  sectionIds: string[],
  isOpen: boolean
) => {
  const [activeSection, setActiveSection] = useState(sectionIds[0]);
  const [userClickedSection, setUserClickedSection] = useState<string | null>(
    null
  );
  const [userClickTimeout, setUserClickTimeout] =
    useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-30% 0px -30% 0px",
      threshold: 0.2,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      if (userClickedSection) return; // Don't update if user just clicked a tab
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const handleScroll = (e: Event) => {
      if (userClickedSection) return;
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    const sectionElements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    sectionElements.forEach((el) => {
      if (el) observer.observe(el);
    });

    const scrollContainer = document.querySelector(".overflow-y-auto");
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
    }

    return () => {
      sectionElements.forEach((el) => {
        if (el) observer.unobserve(el);
      });
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [isOpen, userClickedSection, sectionIds]);

  const scrollToSection = useCallback(
    (sectionId: string) => {
      setActiveSection(sectionId);
      setUserClickedSection(sectionId);

      if (userClickTimeout) {
        clearTimeout(userClickTimeout);
      }
      const timeout = setTimeout(() => {
        setUserClickedSection(null);
      }, 1000);
      setUserClickTimeout(timeout);

      const element = document.getElementById(sectionId);
      const scrollContainer = document.querySelector(".overflow-y-auto");

      if (element && scrollContainer) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [userClickTimeout]
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
