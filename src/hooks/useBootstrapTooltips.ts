import { useEffect } from "react";
import Tooltip from "bootstrap/js/dist/tooltip";

/**
 * Initialize Bootstrap tooltips for elements with data-bs-toggle="tooltip".
 * Cleans up instances and stray DOM nodes on dependency change/unmount.
 *
 * Usage:
 *   useBootstrapTooltips([location.pathname])
 */
export function useBootstrapTooltips(deps: any[] = []) {
  useEffect(() => {
    // Clean existing tooltip DOM nodes (in case of improper disposal elsewhere)
    const oldTooltips = document.querySelectorAll('.tooltip');
    oldTooltips.forEach((el) => el.parentNode && el.parentNode.removeChild(el));

    // Initialize tooltips
    const tooltipTriggerList = Array.from(
      document.querySelectorAll('[data-bs-toggle="tooltip"]')
    ) as HTMLElement[];
    const tooltipInstances = tooltipTriggerList.map((el) => new Tooltip(el));

    return () => {
      // Dispose instances
      tooltipInstances.forEach((instance: any) => instance?.dispose && instance.dispose());
      // Remove leftover DOM nodes
      const tooltips = document.querySelectorAll('.tooltip');
      tooltips.forEach((el) => el.parentNode && el.parentNode.removeChild(el));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
