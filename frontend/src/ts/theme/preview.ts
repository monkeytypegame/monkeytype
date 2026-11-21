import { debounce } from "throttle-debounce";
import { CustomThemeColors } from "@monkeytype/schemas/configs";
import { setThemePreview, ThemeChoice, ThemeIdentifier } from "../states/theme";

let pending: ThemeChoice | null = null;

const debouncedPreview = debounce<() => void>(250, () => {
  if (pending !== null) setThemePreview(pending);
});

/** Shows `theme` over the current one, after a short debounce. */
export function previewTheme(
  theme: ThemeIdentifier,
  customColors?: CustomThemeColors,
): void {
  pending = { name: theme, colors: customColors };
  debouncedPreview();
}

export function clearThemePreview(): void {
  pending = null;
  setThemePreview(null);
}
