import { useState, useEffect, useCallback, RefObject } from "react";

/**
 * Custom hook for scroll spy functionality
 * Tracks which section is currently visible and provides smooth scrolling
 */
export function usePathologyScrollSpy(
  sectionIds: string[],
  containerRef: RefObject<HTMLElement | null>,
  isModalOpen: boolean
) {
  const [activeSection, setActiveSection] = useState(sectionIds[0] || "");
  const [isManualScroll, setIsManualScroll] = useState(false);

  // Scroll spy effect
  useEffect(() => {
    if (!isModalOpen || !containerRef.current) return;

    const scrollContainer = containerRef.current;

    const handleScroll = () => {
      // Skip scroll spy update if manually scrolling (to avoid jitter when clicking tabs)
      if (isManualScroll) return;

      const containerHeight = scrollContainer.clientHeight;
      const scrollPosition = scrollContainer.scrollTop;

      // Use a smaller offset for quicker detection
      const detectionOffset = containerHeight * 0.3; // 30% of container height

      let currentSection = sectionIds[0];

      for (const sectionId of sectionIds) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;

          // An element is "active" if its top is within the detection zone
          // or if we've scrolled past its start but not past its end
          if (
            scrollPosition + detectionOffset >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            currentSection = sectionId;
            break;
          }
        }
      }

      setActiveSection(currentSection);
    };

    // Add scroll listener to the container
    scrollContainer.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [sectionIds, isModalOpen, containerRef, isManualScroll]);

  // Smooth scroll to section within the modal container
  const scrollToSection = useCallback(
    (sectionId: string) => {
      const element = document.getElementById(sectionId);
      const scrollContainer = containerRef.current;

      if (element && scrollContainer) {
        setIsManualScroll(true);
        setActiveSection(sectionId);

        const elementTop = element.offsetTop;
        scrollContainer.scrollTo({
          top: elementTop - 20, // Small offset for better visibility
          behavior: "smooth",
        });

        // Reset manual scroll flag after animation
        setTimeout(() => {
          setIsManualScroll(false);
        }, 500);
      }
    },
    [containerRef]
  );

  return {
    activeSection,
    scrollToSection,
  };
}
