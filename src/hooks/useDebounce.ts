import { useEffect, useState, useMemo } from "react";
import debounce from "lodash.debounce";

export function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState<T>(value);

  const debouncedSetter = useMemo(() => debounce((val: T) => setDebounced(val), delay), [delay]);

  useEffect(() => {
    debouncedSetter(value);
    return () => debouncedSetter.cancel();
  }, [value, debouncedSetter]);

  return debounced;
}

export default useDebounce;
