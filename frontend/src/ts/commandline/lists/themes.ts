import Config, * as UpdateConfig from "../../config";
import { capitalizeFirstLetterOfEachWord } from "../../utils/strings";
import * as ThemeController from "../../controllers/theme-controller";
import { Command, CommandsSubgroup } from "../types";
import { Theme } from "../../utils/json-data";

const subgroup: CommandsSubgroup = {
  title: "Theme...",
  configKey: "theme",
  list: [],
};

const commands: Command[] = [
  {
    id: "changeTheme",
    display: "Theme...",
    icon: "fa-palette",
    subgroup,
  },
];

function createThemeCommand(theme: Theme, isFavorite: boolean): Command {
  return {
    id: "changeTheme" + capitalizeFirstLetterOfEachWord(theme.name),
    display: theme.name.replace(/_/g, " "),
    configValue: theme.name,
    // customStyle: `color:${theme.mainColor};background:${theme.bgColor}`,
    customData: {
      mainColor: theme.mainColor,
      bgColor: theme.bgColor,
      subColor: theme.subColor,
      textColor: theme.textColor,
      isFavorite: isFavorite,
    },
    hover: (): void => {
      // previewTheme(theme.name);
      ThemeController.preview(theme.name);
    },
    exec: (): void => {
      UpdateConfig.setTheme(theme.name);
    },
    // custom HTML element for the favorite star
    html: `<div class="themeFavIcon ${
      isFavorite ? "active" : ""
    }" tabindex="-1">
            <i class="${isFavorite ? "fas" : "far"} fa-star"></i>
          </div>`,
    // click handler for the favorite star
    customHandler: (
      e: MouseEvent | KeyboardEvent,
      command: Command
    ): boolean => {
      // handle both mouse clicks and keyboard events
      const target = e.target as HTMLElement;
      const starIcon = target.closest(".themeFavIcon");

      // check if interaction is with the favorite star
      if (
        starIcon ||
        (e instanceof KeyboardEvent &&
          e.key === "Enter" &&
          target.classList.contains("themeFavIcon"))
      ) {
        e.stopPropagation();

        const themeName = command.configValue as string;

        if (Config.favThemes.includes(themeName)) {
          // remove from favorites
          UpdateConfig.setFavThemes(
            Config.favThemes.filter((t) => t !== themeName)
          );
        } else {
          UpdateConfig.setFavThemes([...Config.favThemes, themeName]);
        }

        // update the star icon immediately
        const iconElement = target.classList.contains("themeFavIcon")
          ? target.querySelector("i")
          : starIcon?.querySelector("i");

        const iconContainer = target.classList.contains("themeFavIcon")
          ? target
          : starIcon;

        if (iconContainer) {
          const isFavorite = Config.favThemes.includes(themeName);
          if (isFavorite) {
            iconContainer.classList.add("active");
          } else {
            iconContainer.classList.remove("active");
          }
          // update icon based on current state
          if (iconElement) {
            iconElement.className = isFavorite ? "fas fa-star" : "far fa-star";
          }
        }

        return false;
      }
      return true;
    },
  };
}

function update(themes: Theme[]): void {
  subgroup.list = [];
  const favs: Command[] = [];
  themes.forEach((theme) => {
    const isFavorite = Config.favThemes.includes(theme.name);
    const themeCommand = createThemeCommand(theme, isFavorite);
    if (isFavorite) {
      favs.push(themeCommand);
    } else {
      subgroup.list.push(themeCommand);
    }
  });
  subgroup.list = [...favs, ...subgroup.list];
}

export default commands;
export { update };
