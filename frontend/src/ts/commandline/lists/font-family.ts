import Config, * as UpdateConfig from "../../config";

const commands: MonkeyTypes.CommandsSubgroup = {
  title: "Font family...",
  configKey: "fontFamily",
  list: [],
};

function update(fonts: MonkeyTypes.FontObject[]): void {
  fonts.forEach((font) => {
    const configVal = font.name.replace(/ /g, "_");
    commands.list.push({
      id: "changeFont" + font.name.replace(/ /g, "_"),
      display: font.display !== undefined ? font.display : font.name,
      configValue: configVal,
      hover: (): void => {
        UpdateConfig.previewFontFamily(font.name);
      },
      exec: (): void => {
        UpdateConfig.setFontFamily(font.name.replace(/ /g, "_"));
      },
    });
  });
  commands.list.push({
    id: "setFontFamilyCustom",
    display: "custom...",
    input: true,
    hover: (): void => {
      UpdateConfig.previewFontFamily(Config.fontFamily);
    },
    exec: (name) => {
      if (!name) return;
      UpdateConfig.setFontFamily(name.replace(/\s/g, "_"));
      // Settings.groups.fontFamily.updateInput();
    },
  });
}

export default commands;
export { update };
