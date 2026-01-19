import { Accessor, createSignal, onCleanup, onMount } from "solid-js";
import { debounce } from "throttle-debounce";

type Breakpoints = {
  xxs: boolean;
  xs: boolean;
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
  "2xl": boolean;
};

export function useTailwindBreakpoints(
  debounceMs = 125,
): Accessor<Breakpoints | undefined> {
  const [breakpoints, setBreakpoints] = createSignal<Breakpoints | undefined>(
    undefined,
  );

  const updateBreakpoints = (): void => {
    const styles = getComputedStyle(document.documentElement);

    const breakpoints = {
      xxs: parseInt(styles.getPropertyValue("--breakpoint-xxs")),
      xs: parseInt(styles.getPropertyValue("--breakpoint-xs")),
      sm: parseInt(styles.getPropertyValue("--breakpoint-sm")),
      md: parseInt(styles.getPropertyValue("--breakpoint-md")),
      lg: parseInt(styles.getPropertyValue("--breakpoint-lg")),
      xl: parseInt(styles.getPropertyValue("--breakpoint-xl")),
      "2xl": parseInt(styles.getPropertyValue("--breakpoint-2xl")),
    };

    const currentWidth = window.innerWidth;

    setBreakpoints({
      xxs: true,
      xs: currentWidth >= breakpoints.xs,
      sm: currentWidth >= breakpoints.sm,
      md: currentWidth >= breakpoints.md,
      lg: currentWidth >= breakpoints.lg,
      xl: currentWidth >= breakpoints.xl,
      "2xl": currentWidth >= breakpoints["2xl"],
    });
  };

  const debouncedUpdate = debounce(debounceMs, updateBreakpoints);

  onMount(() => {
    updateBreakpoints();
    window.addEventListener("resize", debouncedUpdate);
  });

  onCleanup(() => {
    window.removeEventListener("resize", debouncedUpdate);
  });

  return breakpoints;
}
