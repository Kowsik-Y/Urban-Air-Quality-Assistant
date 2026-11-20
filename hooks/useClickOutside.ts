import { useEffect, type RefObject } from 'react';

/**
 * Custom React hook that invokes a callback when a click event occurs
 * outside of the referenced HTML element.
 *
 * @param ref - Ref object pointing to the target DOM container.
 * @param handler - Callback function invoked on outside click.
 * @param active - Optional boolean toggle to activate/deactivate listener.
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void,
  active = true
): void {
  useEffect(() => {
    if (!active) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      // Do nothing if clicking ref's element or descendent elements
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, active]);
}
