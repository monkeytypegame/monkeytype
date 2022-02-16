import * as Misc from "../misc";
import Config, * as UpdateConfig from "../config";

export async function setActiveGroup(
  groupName: string | undefined,
  clicked: boolean | undefined = false
): Promise<void> {
  let currentGroup: MonkeyTypes.LanguageGroup | undefined;

  if (groupName === undefined) {
    currentGroup = await Misc.findCurrentGroup(Config.language);
  } else {
    const groups: MonkeyTypes.LanguageGroup[] = await Misc.getLanguageGroups();
    groups.forEach((g: MonkeyTypes.LanguageGroup) => {
      if (g.name === groupName) {
        currentGroup = g;
      }
    });
  }

  $(`.pageSettings .section.languageGroups .button`).removeClass("active");

  if (currentGroup === undefined) return;

  $(
    `.pageSettings .section.languageGroups .button[group='${currentGroup.name}']`
  ).addClass("active");

  const langElement: JQuery<HTMLElement> = $(
    ".pageSettings .section.language .buttons"
  ).empty();
  currentGroup.languages.forEach((langName: string) => {
    langElement.append(
      `<div class="language button" language='${langName}'>
        ${langName.replace(/_/g, " ")}
      </div>`
    );
  });

  if (clicked) {
    $($(`.pageSettings .section.language .buttons .button`)[0]).addClass(
      "active"
    );
    UpdateConfig.setLanguage(currentGroup.languages[0]);
  } else {
    $(
      `.pageSettings .section.language .buttons .button[language=${Config.language}]`
    ).addClass("active");
  }
}
