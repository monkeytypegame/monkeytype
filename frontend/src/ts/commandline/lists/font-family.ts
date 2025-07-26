import * as UpdateConfig from "../../config";
import { Fonts } from "../../constants/fonts";
import * as UI from "../../ui";
import { typedKeys } from "../../utils/misc";
import { Command, CommandsSubgroup } from "../types";

const subgroup: CommandsSubgroup = {
  title: "Font family...",
  configKey: "fontFamily",
  list: [
    ...typedKeys(Fonts)
      .sort()
      .map((name) => {
        const font = Fonts[name];
        const configVal = name;
        const fontName = name.replaceAll(/_/g, " ");

        const customData: Record<string, string | boolean> = {
          name: fontName,
        };

        if (font.display !== undefined) {
          customData["display"] = font.display;
        }

        customData["isSystem"] = font.systemFont ?? false;

        return {
          id: "changeFont" + name,
          display: font.display !== undefined ? font.display : fontName,
          configValue: configVal,
          customData,
          hover: (): void => {
            UI.previewFontFamily(name);
          },
          exec: (): void => {
            UpdateConfig.setFontFamily(name);
          },
        };
      }),
    {
      id: "setFontFamilyCustom",
      display: "custom...",
      input: true,
      hover: (): void => {
        UI.clearFontPreview();
      },
      exec: ({ input }) => {
        if (input === undefined || input === "") return;
        UpdateConfig.setFontFamily(input.replace(/\s/g, "_"));
        // Settings.groups.fontFamily.updateInput();
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeFontFamily",
    display: "Font family...",
    icon: "fa-font",
    subgroup,
  },
];
export default commands;
