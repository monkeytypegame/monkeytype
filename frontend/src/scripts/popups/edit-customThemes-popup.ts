import * as DB from "../db";
import Config, * as UpdateConfig from "../config";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import { updateActiveTab } from "../settings/theme-picker";

export function show(action: string, id: string, name: string): void {
  if (action === "remove") {
    $("#customThemesWrapper #customThemesEdit").attr("action", "remove");
    $("#customThemesWrapper #customThemesEdit").attr("customThemeId", id);
    $("#customThemesWrapper #customThemesEdit .title").html(
      "Remove custom theme: " + name
    );
    $("#customThemesWrapper #customThemesEdit .button").html(
      `<i class="fas fa-check"></i>`
    );
  }

  if ($("#customThemesWrapper").hasClass("hidden")) {
    $("#customThemesWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, () => {
        $("#customThemesWrapper #customThemesEdit input").focus();
      });
  }
}

function hide(): void {
  if (!$("#customThemesWrapper").hasClass("hidden")) {
    $("#customThemesWrapper #customThemesEdit").attr("action", "");
    $("#customThemesWrapper #customThemesEdit").attr("tagid", "");
    $("#customThemesWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#customThemesWrapper").addClass("hidden");
        }
      );
  }
}

async function apply(): Promise<void> {
  const action = $("#customThemesWrapper #customThemesEdit").attr("action");
  const customThemeId = $("#customThemesWrapper #customThemesEdit").attr(
    "customThemeId"
  ) as string;

  hide();

  if (action === "remove") {
    if (customThemeId === "") {
      console.error(
        "Custom Theme Id attribute not found on the button clicked!"
      );
      return;
    }

    const themeActive = Config.customThemeId === customThemeId;
    Loader.show();
    const deletedTheme = await DB.deleteCustomTheme(customThemeId);
    Loader.hide();

    if (deletedTheme) {
      if (DB.getSnapshot().customThemes.length < 1) {
        UpdateConfig.setCustomThemeId("");
      } else if (themeActive)
        // If active theme was deleted set the first custom theme
        UpdateConfig.setCustomThemeId(DB.getSnapshot().customThemes[0]._id);
      // updateActiveTab(true);
    }
    updateActiveTab(true);

    if (deletedTheme) Notifications.add("Custom theme removed", 1);
  }
}

$("#customThemesWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "customThemesWrapper") {
    hide();
  }
});

$("#customThemesWrapper #customThemesEdit .button").on("click", () => {
  apply();
});

// Handle click on delete custom theme button
$(document).on(
  "click",
  ".pageSettings .section.themes .customTheme .delButton",
  (e) => {
    const $parentElement = $(e.currentTarget).parent(".customTheme.button");
    const customThemeId = $parentElement.attr("customThemeId") as string;
    const name = $parentElement.children(".text").text();
    show("remove", customThemeId, name);
  }
);
