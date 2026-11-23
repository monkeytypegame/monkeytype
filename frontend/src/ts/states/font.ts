import { FontName } from "@monkeytype/schemas/fonts";
import { createSignal } from "solid-js";

// font hovered in the commandline, shown before it is saved to the config
export const [getFontPreview, setFontPreview] = createSignal<FontName | null>(
  null,
);
