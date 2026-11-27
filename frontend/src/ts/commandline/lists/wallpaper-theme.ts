import { getConfig } from "../../config/store";
import {
  selectWallpaperMode,
  selectWallpaperVariant,
  wallpaperError,
} from "../../theme/wallpaper";
import { showErrorNotification } from "../../states/notifications";
import { wallpaperThemeVariants } from "../../utils/wallpaper-theme";
import { Command, CommandsSubgroup } from "../types";

function reportError(): void {
  const error = wallpaperError();
  if (error !== null) {
    showErrorNotification(error);
  }
}

const enableWallpaperTheme: Command = {
  id: "useWallpaperTheme",
  display: "Use wallpaper colors",
  alias: "wallpaper theme",
  configKey: "wallpaperTheme",
  configValue: true,
  exec: async (): Promise<void> => {
    await selectWallpaperVariant(getConfig.wallpaperThemeVariant);
    reportError();
  },
};

const variantCommands: Command[] = wallpaperThemeVariants.map(
  ({ id, name }) => ({
    id: `setWallpaperThemeVariant-${id}`,
    display: name,
    configKey: "wallpaperThemeVariant",
    configValue: id,
    exec: async (): Promise<void> => {
      await selectWallpaperVariant(id);
      reportError();
    },
  }),
);

const modeCommands: Command[] = (["dark", "light"] as const).map((mode) => ({
  id: `setWallpaperThemeMode${mode === "dark" ? "Dark" : "Light"}`,
  display: `${mode === "dark" ? "Dark" : "Light"} tone`,
  configKey: "wallpaperThemeMode",
  configValue: mode,
  exec: async (): Promise<void> => {
    await selectWallpaperMode(mode);
    reportError();
  },
}));

const subgroup: CommandsSubgroup = {
  title: "Wallpaper theme...",
  list: [enableWallpaperTheme, ...variantCommands, ...modeCommands],
};

const commands: Command[] = [
  {
    id: "wallpaperTheme",
    display: "Wallpaper theme...",
    alias: "wallpaper palette colors",
    fa: { icon: "fa-image" },
    subgroup,
  },
];

export default commands;
