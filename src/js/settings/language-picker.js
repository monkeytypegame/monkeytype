import * as Misc from "../misc";
import Config, * as UpdateConfig from "../config";

export async function setActiveGroup(groupName, clicked = false) {
  let currentGroup;
  if (groupName === undefined) {
    currentGroup = await Misc.findCurrentGroup(Config.language);
  } else {
    let groups = await Misc.getLanguageGroups();
    groups.forEach((g) => {
      if (g.name === groupName) {
        currentGroup = g;
      }
    });
  }
  $(`.pageSettings .section.languageGroups .button`).removeClass("active");
  $(
    `.pageSettings .section.languageGroups .button[group='${currentGroup.name}']`
  ).addClass("active");

  let langEl = $(".pageSettings .section.language .buttons").empty();
  currentGroup.languages.forEach((language) => {
    langEl.append(
      `<div class="language button" language='${language}'>${language.replace(
        /_/g,
        " "
      )}</div>`
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
