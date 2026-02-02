import { Accessor, createSignal, onCleanup } from "solid-js";
import { debounce } from "throttle-debounce";

export type BreakpointKey = "xxl" | "xl" | "lg" | "md" | "sm" | "xs" | "xxs";
type Breakpoints = Record<BreakpointKey, boolean>;

const styles = getComputedStyle(document.documentElement);
const tw: Record<BreakpointKey, number> = {
  xxs: 0,
  xs: parseInt(styles.getPropertyValue("--breakpoint-xs")),
  sm: parseInt(styles.getPropertyValue("--breakpoint-sm")),
  md: parseInt(styles.getPropertyValue("--breakpoint-md")),
  lg: parseInt(styles.getPropertyValue("--breakpoint-lg")),
  xl: parseInt(styles.getPropertyValue("--breakpoint-xl")),
  xxl: parseInt(styles.getPropertyValue("--breakpoint-2xl")),
};

export const bp = createBreakpoints(tw);

function createBreakpoints(
  breakpoints: Record<BreakpointKey, number>,
): Accessor<Breakpoints> {
  const queries = Object.fromEntries(
    Object.entries(breakpoints).map(([key, px]) => [
      key,
      window.matchMedia(`(min-width: ${px}px)`),
    ]),
  );

  const [matches, setMatches] = createSignal(
    Object.fromEntries(Object.entries(queries).map(([k, q]) => [k, q.matches])),
  );

  const update = debounce(125, () =>
    setMatches(
      Object.fromEntries(
        Object.entries(queries).map(([k, q]) => [k, q.matches]),
      ),
    ),
  );

  for (const q of Object.values(queries)) {
    q.addEventListener("change", update);
  }

  onCleanup(() => {
    for (const q of Object.values(queries)) {
      q.removeEventListener("change", update);
    }
  });

  return matches as Accessor<Record<BreakpointKey, boolean>>;
}
