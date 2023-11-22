import * as ThemeController from "../controllers/theme-controller";
import Config, * as UpdateConfig from "../config";
import * as Focus from "../test/focus";
import * as CommandlineLists from "./commands";
import * as TestUI from "../test/test-ui";
import * as DB from "../db";
import * as Notifications from "../elements/notifications";
import * as AnalyticsController from "../controllers/analytics-controller";
import * as PageTransition from "../states/page-transition";
import * as TestWords from "../test/test-words";
import * as ActivePage from "../states/active-page";
import { Auth } from "../firebase";
import {
  isAnyPopupVisible,
  isElementVisible,
  isPopupVisible,
} from "../utils/misc";
import { update as updateCustomThemesList } from "./lists/custom-themes-list";
import * as Skeleton from "../popups/skeleton";
import * as ManualRestart from "../test/manual-restart-tracker";

const wrapperId = "commandLineWrapper";

let commandLineMouseMode = false;
let themeChosen = false;

let activeIndex = 0;

const state: Record<string, boolean> = {
  usingSingleList: false,
};

function showInput(
  command: string,
  placeholder: string,
  inputValue = ""
): void {
  $("#commandLineWrapper").removeClass("hidden");
  $("#commandLine").addClass("hidden");
  $("#commandInput").removeClass("hidden");
  $("#commandInput input").attr("placeholder", placeholder);
  $("#commandInput input").val(inputValue);
  $("#commandInput input").trigger("focus");
  $("#commandInput input").attr("command", "");
  $("#commandInput input").attr("command", command);
  if (inputValue != "") {
    $("#commandInput input").trigger("select");
  }
}

function isSingleListCommandLineActive(): boolean {
  return state["usingSingleList"];
}

function removeCommandlineBackground(): void {
  $("#commandLineWrapper").addClass("noBackground");
  if (Config.showOutOfFocusWarning) {
    $("#words").removeClass("blurred");
  }
}

function addCommandlineBackground(): void {
  $("#commandLineWrapper").removeClass("noBackground");
  if (Config.showOutOfFocusWarning) {
    $("#words").addClass("blurred");
  }
}

function showFound(): void {
  $("#commandLine .suggestions").empty();
  let commandsHTML = "";
  const list = CommandlineLists.current[CommandlineLists.current.length - 1];
  let index = 0;
  $.each(list.list, (_index, obj) => {
    if (obj.found && (obj.available !== undefined ? obj.available() : true)) {
      let icon = obj.icon ?? "fa-chevron-right";
      const faIcon = /^fa-/g.test(icon);
      if (!faIcon) {
        icon = `<div class="textIcon">${icon}</div>`;
      } else {
        icon = `<i class="fas fa-fw ${icon}"></i>`;
      }
      if (list.configKey) {
        if (
          (obj.configValueMode &&
            obj.configValueMode === "include" &&
            (
              Config[list.configKey] as (
                | string
                | number
                | boolean
                | number[]
                | undefined
              )[]
            ).includes(obj.configValue)) ||
          Config[list.configKey] === obj.configValue
        ) {
          icon = `<i class="fas fa-fw fa-check"></i>`;
        } else {
          icon = `<i class="fas fa-fw"></i>`;
        }
      }
      let iconHTML = `<div class="icon">${icon}</div>`;
      if (obj.noIcon && !isSingleListCommandLineActive()) {
        iconHTML = "";
      }
      let customStyle = "";
      if (obj.customStyle) {
        customStyle = obj.customStyle;
      }

      if (obj.id.startsWith("changeTheme") && obj.customData) {
        commandsHTML += `<div class="entry withThemeBubbles" command="${obj.id}" index="${index}" style="${customStyle}">
        ${iconHTML}<div>${obj.display}</div>
        <div class="themeBubbles" style="background: ${obj.customData["bgColor"]};outline: 0.25rem solid ${obj.customData["bgColor"]};">
          <div class="themeBubble" style="background: ${obj.customData["mainColor"]}"></div>
          <div class="themeBubble" style="background: ${obj.customData["subColor"]}"></div>
          <div class="themeBubble" style="background: ${obj.customData["textColor"]}"></div>
        </div>
        </div>`;
      } else {
        commandsHTML += `<div class="entry" command="${obj.id}" index="${index}" style="${customStyle}">${iconHTML}<div>${obj.display}</div></div>`;
      }
      index++;
    }
  });
  $("#commandLine .suggestions").html(commandsHTML);
  if ($("#commandLine .suggestions .entry").length === 0) {
    $("#commandLine .separator").css({ height: 0, margin: 0 });
  } else {
    $("#commandLine .separator").css({
      height: "1px",
      "margin-bottom": ".5rem",
    });
  }
  const entries = $("#commandLine .suggestions .entry");
  if (entries.length > 0) {
    try {
      $.each(list.list, (_index, obj) => {
        if (obj.found) {
          if (/changeTheme.+/gi.test(obj.id)) {
            removeCommandlineBackground();
          } else {
            addCommandlineBackground();
          }
          if (
            (!/theme/gi.test(obj.id) || obj.id === "toggleCustomTheme") &&
            !ThemeController.randomTheme
          ) {
            ThemeController.clearPreview();
          }
          if (!/font/gi.test(obj.id)) {
            UpdateConfig.previewFontFamily(Config.fontFamily);
          }
          if (obj.hover) obj.hover();
          return false;
        } else {
          return true;
        }
      });
    } catch (e) {}
  }
  $("#commandLine .listTitle").remove();
}

function updateSuggested(): void {
  const inputVal = ($("#commandLine input").val() as string)
    .toLowerCase()
    .split(" ")
    .filter((s, i) => s || i === 0); //remove empty entries after first
  const list = CommandlineLists.current[CommandlineLists.current.length - 1];

  if (list.beforeList) list.beforeList();

  if (
    inputVal[0] === "" &&
    Config.singleListCommandLine === "on" &&
    CommandlineLists.current.length === 1
  ) {
    $.each(list.list, (_index, obj) => {
      obj.found = false;
    });
    showFound();
    return;
  }
  //ignore the preceeding ">"s in the command line input
  if (inputVal[0] && inputVal[0][0] === ">") {
    inputVal[0] = inputVal[0].replace(/^>+/, "");
  }
  if (inputVal[0] === "" && inputVal.length === 1) {
    $.each(list.list, (_index, obj) => {
      if (obj.visible !== false) obj.found = true;
    });
  } else {
    $.each(list.list, (_index, obj) => {
      let foundcount = 0;
      $.each(inputVal, (_index2, obj2) => {
        if (obj2 === "") return;
        const escaped = obj2.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        const re = new RegExp("\\b" + escaped, "g");
        const res = obj.display.toLowerCase().match(re);
        const res2 =
          obj.alias !== undefined ? obj.alias.toLowerCase().match(re) : null;
        if (
          (res != null && res.length > 0) ||
          (res2 != null && res2.length > 0)
        ) {
          foundcount++;
        } else {
          foundcount--;
        }
      });
      if (foundcount > inputVal.length - 1) {
        obj.found = true;
      } else {
        obj.found = false;
      }
    });
  }
  showFound();

  // display background hover effect for selected language
  const scrollTarget = $(".suggestions .entry .icon i.fa-check");
  const entryIndex = scrollTarget.parent().parent().attr("index");
  if (entryIndex !== undefined) {
    activeIndex = parseInt(entryIndex);
  } else {
    activeIndex = 0;
  }

  updateActiveEntry();
  keepActiveEntryInView();
}

function show(): void {
  themeChosen = false;
  activeIndex = 0;
  commandLineMouseMode = false;

  //take last element of array
  if (isElementVisible(".page.pageLoading")) return;
  Focus.set(false);
  Skeleton.append(wrapperId);
  $("#commandLine").removeClass("hidden");
  $("#commandInput").addClass("hidden");

  if (state["usingSingleList"]) {
    $("#commandLine").addClass("allCommands");
  }

  if (!isPopupVisible(wrapperId)) {
    $("#commandLineWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate(
        {
          opacity: 1,
        },
        125
      );
  }
  $("#commandLine input").val("");
  updateSuggested();
  $("#commandLine input").trigger("focus");
}

function hide(shouldFocusTestUI = true): void {
  UpdateConfig.previewFontFamily(Config.fontFamily);
  // applyCustomThemeColors();
  if (!ThemeController.randomTheme) {
    ThemeController.clearPreview();
  }
  $("#commandLineWrapper")
    .stop(true, true)
    .css("opacity", 1)
    .animate(
      {
        opacity: 0,
      },
      125,
      () => {
        addCommandlineBackground();
        $("#commandLineWrapper").addClass("hidden");
        $("#commandLine").removeClass("allCommands");
        state["usingSingleList"] = false;
        if (shouldFocusTestUI) {
          TestUI.focusWords();
        }
        Skeleton.remove(wrapperId);
      }
    );
  if (shouldFocusTestUI) {
    TestUI.focusWords();
  }
}

function trigger(command: string): void {
  let subgroup = false;
  let input = false;
  let shouldFocusTestUI = true;
  const list = CommandlineLists.current[CommandlineLists.current.length - 1];
  let sticky = false;

  ManualRestart.set();

  $.each(list.list, (_index, obj) => {
    if (obj.id === command) {
      if (obj.shouldFocusTestUI !== undefined) {
        shouldFocusTestUI = obj.shouldFocusTestUI;
      }
      if (obj.input) {
        input = true;
        const escaped = obj.display.split("</i>")[1] ?? obj.display;
        showInput(obj.id, escaped, obj.defaultValue ? obj.defaultValue() : "");
      } else if (obj.subgroup) {
        subgroup = true;
        if (obj.subgroup.beforeList) {
          obj.subgroup.beforeList();
        }
        CommandlineLists.current.push(
          obj.subgroup as MonkeyTypes.CommandsSubgroup
        );
        show();
      } else {
        if (obj.exec) obj.exec();
        if (obj.sticky === true) {
          sticky = true;
        }
      }
    }
  });
  if (!subgroup && !input && !sticky) {
    AnalyticsController.log("usedCommandLine", { command });
    hide(shouldFocusTestUI);
  }
}

function getCommands(
  command: MonkeyTypes.Command,
  parentCommand?: MonkeyTypes.Command
): MonkeyTypes.Command[] {
  const ret: MonkeyTypes.Command[] = [];
  if (command.subgroup) {
    const currentCommand = {
      ...command,
      subgroup: {
        ...command.subgroup,
        list: [],
      },
    };
    command.subgroup.beforeList?.();
    for (const cmd of command.subgroup.list) {
      ret.push(...getCommands(cmd, currentCommand));
    }
  } else {
    if (parentCommand) {
      const parentCommandDisplay = parentCommand.display.replace(
        /\s?\.\.\.$/g,
        ""
      );
      let configIcon = "";
      const parentKey = parentCommand.subgroup?.configKey;
      const currentValue = command.configValue;
      if (parentKey !== undefined && currentValue !== undefined) {
        if (
          (command.configValueMode === "include" &&
            (Config[parentKey] as unknown[]).includes(currentValue)) ||
          Config[parentKey] === currentValue
        ) {
          configIcon = `<i class="fas fa-fw fa-check"></i>`;
        } else {
          configIcon = `<i class="fas fa-fw"></i>`;
        }
      }
      const displayString =
        parentCommandDisplay +
        " > " +
        (command.noIcon ? "" : configIcon) +
        command.display;
      const newCommand = {
        ...command,
        display: displayString,
        icon: parentCommand.icon,
        alias: (parentCommand.alias ?? "") + " " + (command.alias ?? ""),
        visible: (parentCommand.visible ?? true) && (command.visible ?? true),
        available: (): boolean => {
          return (
            (parentCommand?.available?.() ?? true) &&
            (command?.available?.() ?? true)
          );
        },
      };
      ret.push(newCommand);
    } else {
      ret.push(command);
    }
  }
  return ret;
}

function generateSingleListOfCommands(): {
  title: string;
  list: MonkeyTypes.Command[];
} {
  const allCommands: MonkeyTypes.Command[] = [];
  for (const command of CommandlineLists.commands.list) {
    allCommands.push(...getCommands(command));
  }

  return {
    title: "All Commands",
    list: allCommands,
  };
}

function useSingleListCommandLine(sshow = true): void {
  const allCommands = generateSingleListOfCommands();
  // if (Config.singleListCommandLine === "manual") {
  // CommandlineLists.pushCurrent(allCommands);
  // } else if (Config.singleListCommandLine === "on") {
  CommandlineLists.setCurrent([allCommands]);
  // }
  if (Config.singleListCommandLine != "manual") {
    state["usingSingleList"] = true;
    $("#commandLine").addClass("allCommands");
  }
  if (sshow) show();
}

function restoreOldCommandLine(sshow = true): void {
  if (isSingleListCommandLineActive()) {
    state["usingSingleList"] = false;
    $("#commandLine").removeClass("allCommands");
    CommandlineLists.setCurrent(
      CommandlineLists.current.filter((l) => l.title != "All Commands")
    );
    if (CommandlineLists.current.length < 1) {
      CommandlineLists.setCurrent([CommandlineLists.commands]);
    }
  }
  if (sshow) show();
}

function updateActiveEntry(): void {
  $(`#commandLineWrapper #commandLine .suggestions .entry`).removeClass(
    "active"
  );
  $(
    `#commandLineWrapper #commandLine .suggestions .entry[index=${activeIndex}]`
  ).addClass("active");
}

function keepActiveEntryInView(): void {
  try {
    const scroll =
      Math.abs(
        ($(".suggestions").offset()?.top as number) -
          ($(".entry.active").offset()?.top as number) -
          ($(".suggestions").scrollTop() as number)
      ) -
      ($(".suggestions").outerHeight() as number) / 2 +
      ($($(".entry")[0]).outerHeight() as number);
    $(".suggestions").scrollTop(scroll);
  } catch (e) {
    if (e instanceof Error) {
      console.log("could not scroll suggestions: " + e.message);
    }
  }
}

$("#commandLineWrapper #commandLine input").on("input", () => {
  commandLineMouseMode = false;
  updateSuggested();
});

$(document).ready(() => {
  $(document).on("keydown", (event) => {
    if (PageTransition.get()) return;
    // opens command line if escape or ctrl/cmd + shift + p
    if (
      ((event.key === "Escape" && Config.quickRestart !== "esc") ||
        (event.key?.toLowerCase() === "p" &&
          (event.metaKey || event.ctrlKey) &&
          event.shiftKey) ||
        ((event.key === "Tab" || event.key === "Escape") &&
          Config.quickRestart === "esc")) &&
      isPopupVisible(wrapperId)
    ) {
      if (CommandlineLists.current.length > 1) {
        CommandlineLists.current.pop();
        state["usingSingleList"] = false;
        $("#commandLine").removeClass("allCommands");
        show();
      } else {
        hide();
      }
      UpdateConfig.setFontFamily(Config.fontFamily, true);
      return;
    }
    if (
      (event.key === "Escape" && Config.quickRestart !== "esc") ||
      (event.key === "Tab" &&
        Config.quickRestart === "esc" &&
        !TestWords.hasTab &&
        !event.shiftKey) ||
      (event.key === "Tab" &&
        Config.quickRestart === "esc" &&
        TestWords.hasTab &&
        event.shiftKey) ||
      (event.key &&
        event.key.toLowerCase() === "p" &&
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey)
    ) {
      const popupVisible = isAnyPopupVisible();
      const miniResultPopupVisible = isElementVisible(
        ".pageAccount .miniResultChartWrapper"
      );

      if (popupVisible || miniResultPopupVisible) return;

      if (Config.quickRestart === "esc" && ActivePage.get() === "login") return;
      event.preventDefault();

      if (Config.singleListCommandLine === "on") {
        useSingleListCommandLine(false);
      } else {
        CommandlineLists.setCurrent([CommandlineLists.commands]);
      }
      show();
    }
  });
});

$("#commandInput input").on("keydown", (e) => {
  if (e.key === "Enter") {
    //enter
    e.preventDefault();
    const command = $("#commandInput input").attr("command");
    const value = $("#commandInput input").val() as string;
    const list = CommandlineLists.current[CommandlineLists.current.length - 1];
    $.each(list.list, (_index, obj) => {
      if (obj.id === command) {
        if (obj.exec) obj.exec(value);
      }
    });
    AnalyticsController.log("usedCommandLine", { command: command ?? "" });
    hide();
  }
  return;
});

$(document).on("mousemove", () => {
  if (!commandLineMouseMode) commandLineMouseMode = true;
});

$("#commandLineWrapper #commandLine").on(
  "mouseenter",
  ".suggestions .entry",
  (e) => {
    if (!commandLineMouseMode) return;
    activeIndex = parseInt($(e.target).attr("index") ?? "0");
    updateActiveEntry();
  }
);

$("#commandLineWrapper #commandLine").on(
  "mouseleave",
  ".suggestions .entry",
  (e) => {
    if (!commandLineMouseMode) return;
    activeIndex = parseInt($(e.target).attr("index") ?? "0");
    updateActiveEntry();
  }
);

$("#commandLineWrapper #commandLine .suggestions").on("mouseover", (e) => {
  if (!commandLineMouseMode) return;
  const hoverId = $(e.target).attr("command");
  try {
    const list = CommandlineLists.current[CommandlineLists.current.length - 1];
    $.each(list.list, (_index, obj) => {
      if (obj.id === hoverId) {
        if (/changeTheme.+/gi.test(obj.id)) {
          removeCommandlineBackground();
        } else {
          addCommandlineBackground();
        }
        if (
          (!/theme/gi.test(obj.id) || obj.id === "toggleCustomTheme") &&
          !ThemeController.randomTheme
        ) {
          ThemeController.clearPreview();
        }
        if (!/font/gi.test(obj.id)) {
          UpdateConfig.previewFontFamily(Config.fontFamily);
        }
        if (obj.hover && !themeChosen) obj.hover();
      }
    });
  } catch (e) {}
});

$("#commandLineWrapper #commandLine").on(
  "click",
  ".suggestions .entry",
  (e) => {
    themeChosen = true;
    trigger($(e.currentTarget).attr("command") as string);
  }
);

$("#commandLineWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "commandLineWrapper") {
    hide();
    UpdateConfig.setFontFamily(Config.fontFamily, true);
    // if (Config.customTheme === true) {
    //   applyCustomThemeColors();
    // } else {
    //   setTheme(Config.theme, true);
    // }
  }
});

//might come back to it later
// function shiftCommand(){
//   let activeEntries = $("#commandLineWrapper #commandLine .suggestions .entry.active");
//   activeEntries.each((_index, activeEntry) => {
//     let commandId = activeEntry.getAttribute('command');
//     let foundCommand = null;
//     CommandlineLists.defaultCommands.list.forEach(command => {
//       if(foundCommand === null && command.id === commandId){
//         foundCommand = command;
//       }
//     })
//     if(foundCommand.shift){
//       $(activeEntry).find('div').text(foundCommand.shift.display);
//     }
//   })
// }

// let shiftedCommands = false;
// $(document).on("keydown", (e) => {
//   if (e.key === "Shift") {
//     if(shiftedCommands === false){
//       shiftedCommands = true;
//       shiftCommand();
//     }

//   }
// });

// $(document).keyup((e) => {
//   if (e.key === "Shift") {
//     shiftedCommands = false;
//   }
// });

$(document).on("keydown", (e) => {
  // if (isPreviewingTheme) {
  // console.log("applying theme");
  // applyCustomThemeColors();
  // previewTheme(Config.theme, false);
  // }
  if (isPopupVisible(wrapperId)) {
    $("#commandLine input").trigger("focus");
    commandLineMouseMode = false;
    if (e.key === ">" && Config.singleListCommandLine === "manual") {
      if (!isSingleListCommandLineActive()) {
        state["usingSingleList"] = true;
        useSingleListCommandLine(false);
        return;
      } else if ($("#commandLine input").val() === ">") {
        //so that it will ignore succeeding ">" when input is already ">"
        e.preventDefault();
        return;
      }
    }

    if (e.key === "Backspace" || e.key === "Delete") {
      setTimeout(() => {
        const inputVal = $("#commandLine input").val() as string;
        if (
          Config.singleListCommandLine === "manual" &&
          isSingleListCommandLineActive() &&
          inputVal[0] !== ">"
        ) {
          restoreOldCommandLine(false);
          updateSuggested();
        }
      }, 1);
    }

    if (e.key === "Enter") {
      //enter
      e.preventDefault();
      const command = $(".suggestions .entry.active").attr("command") as string;
      trigger(command);
      return;
    }
    if (
      e.key === "ArrowUp" ||
      e.key === "ArrowDown" ||
      e.key === "Tab" ||
      // Should only branch if ctrl is held to allow the letters to still be typed
      (e.ctrlKey &&
        (e.key === "p" || e.key === "n" || e.key === "j" || e.key === "k"))
    ) {
      e.preventDefault();
      $("#commandLineWrapper #commandLine .suggestions .entry").off(
        "mouseenter mouseleave"
      );
      const entries = $(".suggestions .entry");
      if (
        e.key === "ArrowUp" ||
        (e.key === "Tab" && e.shiftKey && Config.quickRestart !== "esc") ||
        // Don't need to check for ctrl because that was already done above
        e.key === "p" ||
        e.key === "k"
      ) {
        if (activeIndex === 0) {
          activeIndex = entries.length - 1;
        } else {
          activeIndex--;
        }
      }
      if (
        e.key === "ArrowDown" ||
        (e.key === "Tab" && !e.shiftKey && Config.quickRestart !== "esc") ||
        e.key === "n" ||
        e.key === "j"
      ) {
        if (activeIndex + 1 === entries.length) {
          activeIndex = 0;
        } else {
          activeIndex++;
        }
      }
      updateActiveEntry();
      keepActiveEntryInView();
      try {
        const list =
          CommandlineLists.current[CommandlineLists.current.length - 1];
        const activeCommandId = $(
          "#commandLineWrapper #commandLine .suggestions .entry.active"
        ).attr("command");
        $.each(list.list, (_index, obj) => {
          if (obj.id === activeCommandId) {
            if (/changeTheme.+/gi.test(obj.id)) {
              removeCommandlineBackground();
            } else {
              addCommandlineBackground();
            }
            if (
              (!/theme/gi.test(obj.id) || obj.id === "toggleCustomTheme") &&
              !ThemeController.randomTheme
            ) {
              ThemeController.clearPreview();
            }
            if (!/font/gi.test(obj.id)) {
              UpdateConfig.previewFontFamily(Config.fontFamily);
            }
            if (obj.hover) obj.hover();
          }
        });
      } catch (e) {}
      return false;
    }
  }
  return;
});

$("#commandLineMobileButton").on("click", () => {
  if (Config.singleListCommandLine === "on") {
    useSingleListCommandLine(false);
  } else {
    CommandlineLists.setCurrent([CommandlineLists.commands]);
  }
  show();
});

$("#keymap").on("click", ".r5 .keySpace", () => {
  CommandlineLists.setCurrent([CommandlineLists.getList("keymapLayouts")]);
  show();
});

$(".pageTest").on("click", "#testModesNotice .textButton", (event) => {
  const attr = $(event.currentTarget).attr(
    "commands"
  ) as CommandlineLists.ListsObjectKeys;
  if (attr === undefined) return;
  const commands = CommandlineLists.getList(attr);
  if (commands !== undefined) {
    CommandlineLists.pushCurrent(commands);
    show();
  }
});

$("footer").on("click", ".leftright .right .current-theme", (e) => {
  if (e.shiftKey) {
    if (!Config.customTheme) {
      if (Auth?.currentUser) {
        if ((DB.getSnapshot()?.customThemes.length ?? 0) < 1) {
          Notifications.add("No custom themes!", 0);
          UpdateConfig.setCustomTheme(false);
          // UpdateConfig.setCustomThemeId("");
          return;
        }
        // if (!DB.getCustomThemeById(Config.customThemeId)) {
        //   // Turn on the first custom theme
        //   const firstCustomThemeId = DB.getSnapshot().customThemes[0]._id;
        //   UpdateConfig.setCustomThemeId(firstCustomThemeId);
        // }
      }
      UpdateConfig.setCustomTheme(true);
    } else UpdateConfig.setCustomTheme(false);
  } else {
    if (Config.customTheme) updateCustomThemesList();
    CommandlineLists.setCurrent([
      Config.customTheme
        ? CommandlineLists.getList("customThemesList")
        : CommandlineLists.getList("themes"),
    ]);
    show();
  }
});

$(".supportButtons button.ads").on("click", () => {
  CommandlineLists.pushCurrent(CommandlineLists.getList("enableAds"));
  show();
});

$(document.body).on("click", "#supportMeWrapper button.ads", () => {
  CommandlineLists.pushCurrent(CommandlineLists.getList("enableAds"));
  show();
});

Skeleton.save(wrapperId);
