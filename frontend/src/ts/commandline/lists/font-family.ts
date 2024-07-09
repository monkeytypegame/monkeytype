import * as UpdateConfig from "../../config";
import * as UI from "../../ui";

const subgroup: MonkeyTypes.CommandsSubgroup = {
  title: "Font family...",
  configKey: "fontFamily",
  list: [],
};

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeFontFamily",
    display: "Font family...",
    icon: "fa-font",
    subgroup,
  },
];

function update(fonts: MonkeyTypes.FontObject[]): void {
  fonts.forEach((font) => {
    const configVal = font.name.replace(/ /g, "_");

    const customData: Record<string, string | boolean> = {
      name: font.name,
    };

    if (font.display !== undefined) {
      customData["display"] = font.display;
    }

    customData["isSystem"] = font.systemFont ?? false;

    subgroup.list.push({
      id: "changeFont" + font.name.replace(/ /g, "_"),
      display: font.display !== undefined ? font.display : font.name,
      configValue: configVal,
      customData,
      hover: (): void => {
        UI.previewFontFamily(font.name);
      },
      exec: (): void => {
        UpdateConfig.setFontFamily(font.name.replace(/ /g, "_"));
      },
    });
  });
  subgroup.list.push({
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
  });
}

export default commands;
export { update };
