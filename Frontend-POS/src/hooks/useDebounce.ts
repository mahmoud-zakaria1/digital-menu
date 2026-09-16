import { useEffect, useState } from "react";

// Delays updating the returned value until `value` has stopped changing
// for `delayMs` - used to avoid firing an API request on every keystroke
// in the menu search box.
export const useDebounce = <T>(value: T, delayMs = 400): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debouncedValue;
};
