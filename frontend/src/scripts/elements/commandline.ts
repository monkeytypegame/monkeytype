import * as ThemeController from "../controllers/theme-controller";
import Config, * as UpdateConfig from "../config";
import * as Focus from "../test/focus";
import * as CommandlineLists from "./commandline-lists";
import * as TestUI from "../test/test-ui";
import * as DB from "../db";
import * as Notifications from "../elements/notifications";

let commandLineMouseMode = false;

function showInput(
  command: string,
  placeholder: string,
  defaultValue = ""
): void {
  $("#commandLineWrapper").removeClass("hidden");
  $("#commandLine").addClass("hidden");
  $("#commandInput").removeClass("hidden");
  $("#commandInput input").attr("placeholder", placeholder);
  $("#commandInput input").val(defaultValue);
  $("#commandInput input").trigger("focus");
  $("#commandInput input").attr("command", "");
  $("#commandInput input").attr("command", command);
  if (defaultValue != "") {
    $("#commandInput input").select();
  }
}

export function isSingleListCommandLineActive(): boolean {
  return $("#commandLine").hasClass("allCommands");
}

function showFound(): void {
  $("#commandLine .suggestions").empty();
  let commandsHTML = "";
  const list = CommandlineLists.current[CommandlineLists.current.length - 1];
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
            // todo figure this out without using any
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
      commandsHTML += `<div class="entry" command="${obj.id}">${iconHTML}<div>${obj.display}</div></div>`;
    }
  });
  $("#commandLine .suggestions").html(commandsHTML);
  if ($("#commandLine .suggestions .entry").length == 0) {
    $("#commandLine .separator").css({ height: 0, margin: 0 });
  } else {
    $("#commandLine .separator").css({
      height: "1px",
      "margin-bottom": ".5rem",
    });
  }
  const entries = $("#commandLine .suggestions .entry");
  if (entries.length > 0) {
    $(entries[0]).addClass("activeKeyboard");
    try {
      $.each(list.list, (_index, obj) => {
        if (obj.found) {
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
    .filter((s, i) => s || i == 0); //remove empty entries after first
  const list = CommandlineLists.current[CommandlineLists.current.length - 1];
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
  if (inputVal[0] && inputVal[0][0] == ">") {
    inputVal[0] = inputVal[0].replace(/^>+/, "");
  }
  if (inputVal[0] == "" && inputVal.length == 1) {
    $.each(list.list, (_index, obj) => {
      if (obj.visible !== false) obj.found = true;
    });
  } else {
    $.each(list.list, (_index, obj) => {
      let foundcount = 0;
      $.each(inputVal, (_index2, obj2) => {
        if (obj2 == "") return;
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
}

export let show = (): void => {
  if (!$(".page.pageLoading").hasClass("hidden")) return;
  Focus.set(false);
  $("#commandLine").removeClass("hidden");
  $("#commandInput").addClass("hidden");
  if ($("#commandLineWrapper").hasClass("hidden")) {
    $("#commandLineWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate(
        {
          opacity: 1,
        },
        100
      );
  }
  $("#commandLine input").val("");
  CommandlineLists.updateThemeCommands();
  updateSuggested();
  $("#commandLine input").trigger("focus");
};

function hide(): void {
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
      100,
      () => {
        $("#commandLineWrapper").addClass("hidden");
        $("#commandLine").removeClass("allCommands");
        TestUI.focusWords();
      }
    );
  TestUI.focusWords();
}

function trigger(command: string): void {
  let subgroup = false;
  let input = false;
  const list = CommandlineLists.current[CommandlineLists.current.length - 1];
  let sticky = false;
  $.each(list.list, (_index, obj) => {
    if (obj.id == command) {
      if (obj.input) {
        input = true;
        const escaped = obj.display.split("</i>")[1] ?? obj.display;
        showInput(obj.id, escaped, obj.defaultValue);
      } else if (obj.subgroup) {
        subgroup = true;
        if (obj.beforeSubgroup) {
          obj.beforeSubgroup();
        }
        CommandlineLists.current.push(
          obj.subgroup as MonkeyTypes.CommandsGroup
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
    try {
      firebase.analytics().logEvent("usedCommandLine", {
        command: command,
      });
    } catch (e) {
      console.log("Analytics unavailable");
    }
    hide();
  }
}

//todo rewrite this mess
function addChildCommands(
  unifiedCommands: MonkeyTypes.Command[],
  commandItem: MonkeyTypes.Command | MonkeyTypes.CommandsGroup,
  parentCommandDisplay = "",
  parentCommand?: MonkeyTypes.CommandsGroup
): void {
  let commandItemDisplay = (commandItem as MonkeyTypes.Command).display.replace(
    /\s?\.\.\.$/g,
    ""
  );
  let icon = `<i class="fas fa-fw"></i>`;
  if (
    (commandItem as MonkeyTypes.Command).configValue !== undefined &&
    Config[parentCommand?.configKey as keyof MonkeyTypes.Config] ===
      (commandItem as MonkeyTypes.Command).configValue
  ) {
    icon = `<i class="fas fa-fw fa-check"></i>`;
  }
  if ((commandItem as MonkeyTypes.Command).noIcon) {
    icon = "";
  }

  if (parentCommandDisplay) {
    commandItemDisplay =
      parentCommandDisplay + " > " + icon + commandItemDisplay;
  }
  if ((commandItem as MonkeyTypes.Command).subgroup) {
    const command = commandItem as MonkeyTypes.Command;
    if (command.beforeSubgroup) command.beforeSubgroup();
    try {
      (
        (commandItem as MonkeyTypes.Command)
          ?.subgroup as MonkeyTypes.CommandsGroup
      ).list?.forEach((cmd) => {
        (commandItem as MonkeyTypes.CommandsGroup).configKey = (
          (commandItem as MonkeyTypes.Command)
            .subgroup as MonkeyTypes.CommandsGroup
        ).configKey;
        addChildCommands(
          unifiedCommands,
          cmd,
          commandItemDisplay,
          commandItem as MonkeyTypes.CommandsGroup
        );
      });
      // commandItem.exec();
      // const currentCommandsIndex = CommandlineLists.current.length - 1;
      // CommandlineLists.current[currentCommandsIndex].list.forEach((cmd) => {
      //   if (cmd.alias === undefined) cmd.alias = commandItem.alias;
      //   addChildCommands(unifiedCommands, cmd, commandItemDisplay);
      // });
      // CommandlineLists.current.pop();
    } catch (e) {}
  } else {
    const tempCommandItem: MonkeyTypes.Command = {
      ...(commandItem as MonkeyTypes.Command),
    };
    if (parentCommand) {
      (tempCommandItem as MonkeyTypes.Command).icon = (
        parentCommand as unknown as MonkeyTypes.Command
      ).icon;
    }
    if (parentCommandDisplay) tempCommandItem.display = commandItemDisplay;
    unifiedCommands.push(tempCommandItem);
  }
}

function generateSingleListOfCommands(): {
  title: string;
  list: MonkeyTypes.Command[];
} {
  const allCommands: MonkeyTypes.Command[] = [];
  const oldShowCommandLine = show;
  show = (): void => {
    //
  };
  CommandlineLists.defaultCommands.list.forEach((c) =>
    addChildCommands(allCommands, c)
  );
  show = oldShowCommandLine;
  return {
    title: "All Commands",
    list: allCommands,
  };
}

function useSingleListCommandLine(sshow = true): void {
  const allCommands = generateSingleListOfCommands();
  // if (Config.singleListCommandLine == "manual") {
  // CommandlineLists.pushCurrent(allCommands);
  // } else if (Config.singleListCommandLine == "on") {
  CommandlineLists.setCurrent([allCommands]);
  // }
  if (Config.singleListCommandLine != "manual") {
    $("#commandLine").addClass("allCommands");
  }
  if (sshow) show();
}

function restoreOldCommandLine(sshow = true): void {
  if (isSingleListCommandLineActive()) {
    $("#commandLine").removeClass("allCommands");
    CommandlineLists.setCurrent(
      CommandlineLists.current.filter((l) => l.title != "All Commands")
    );
    if (CommandlineLists.current.length < 1) {
      CommandlineLists.setCurrent([CommandlineLists.defaultCommands]);
    }
  }
  if (sshow) show();
}

$("#commandLine input").keyup((e) => {
  commandLineMouseMode = false;
  $("#commandLineWrapper #commandLine .suggestions .entry").removeClass(
    "activeMouse"
  );
  if (
    e.key === "ArrowUp" ||
    e.key === "ArrowDown" ||
    e.key === "Enter" ||
    e.key === "Tab" ||
    e.code == "AltLeft" ||
    (e.key.length > 1 && e.key !== "Backspace" && e.key !== "Delete")
  ) {
    return;
  }
  updateSuggested();
});

$(document).ready(() => {
  $(document).on("keydown", (event) => {
    // opens command line if escape, ctrl/cmd + shift + p, or tab is pressed if the setting swapEscAndTab is enabled
    if (
      event.key === "Escape" ||
      (event.key &&
        event.key.toLowerCase() === "p" &&
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey) ||
      (event.key === "Tab" && Config.swapEscAndTab)
    ) {
      event.preventDefault();

      const popups = document.querySelectorAll(".popupWrapper");

      let popupVisible = false;
      for (const popup of popups) {
        if (!popup.classList.contains("hidden") === true) {
          popupVisible = true;
          break;
        }
      }

      if (popupVisible) return;

      if (!$("#commandLineWrapper").hasClass("hidden")) {
        if (CommandlineLists.current.length > 1) {
          CommandlineLists.current.pop();
          $("#commandLine").removeClass("allCommands");
          show();
        } else {
          hide();
        }
        UpdateConfig.setFontFamily(Config.fontFamily, true);
      } else if (event.key === "Tab" || !Config.swapEscAndTab) {
        if (Config.singleListCommandLine == "on") {
          useSingleListCommandLine(false);
        } else {
          CommandlineLists.setCurrent([CommandlineLists.defaultCommands]);
        }
        show();
      }
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
      if (obj.id == command) {
        if (obj.exec) obj.exec(value);
        if (obj.subgroup !== null && obj.subgroup !== undefined) {
          //TODO: what is this for?
          // subgroup = obj.subgroup;
        }
      }
    });
    try {
      firebase.analytics().logEvent("usedCommandLine", {
        command: command,
      });
    } catch (e) {
      console.log("Analytics unavailable");
    }
    hide();
  }
  return;
});

$(document).on("mousemove", () => {
  if (!commandLineMouseMode) commandLineMouseMode = true;
});

$(document).on(
  "mouseenter",
  "#commandLineWrapper #commandLine .suggestions .entry",
  (e) => {
    if (!commandLineMouseMode) return;
    $(e.target).addClass("activeMouse");
  }
);

$(document).on(
  "mouseleave",
  "#commandLineWrapper #commandLine .suggestions .entry",
  (e) => {
    if (!commandLineMouseMode) return;
    $(e.target).removeClass("activeMouse");
  }
);

$("#commandLineWrapper #commandLine .suggestions").on("mouseover", (e) => {
  if (!commandLineMouseMode) return;
  // console.log("clearing keyboard active");
  $("#commandLineWrapper #commandLine .suggestions .entry").removeClass(
    "activeKeyboard"
  );
  const hoverId = $(e.target).attr("command");
  try {
    const list = CommandlineLists.current[CommandlineLists.current.length - 1];
    $.each(list.list, (_index, obj) => {
      if (obj.id == hoverId) {
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
});

$(document).on(
  "click",
  "#commandLineWrapper #commandLine .suggestions .entry",
  (e) => {
    $(".suggestions .entry").removeClass("activeKeyboard");
    trigger($(e.currentTarget).attr("command") as string);
  }
);

$("#commandLineWrapper").on("click", (e) => {
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
//   let activeEntries = $("#commandLineWrapper #commandLine .suggestions .entry.activeKeyboard, #commandLineWrapper #commandLine .suggestions .entry.activeMouse");
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
  if (!$("#commandLineWrapper").hasClass("hidden")) {
    $("#commandLine input").trigger("focus");
    if (e.key == ">" && Config.singleListCommandLine == "manual") {
      if (!isSingleListCommandLineActive()) {
        useSingleListCommandLine(false);
        return;
      } else if ($("#commandLine input").val() == ">") {
        //so that it will ignore succeeding ">" when input is already ">"
        e.preventDefault();
        return;
      }
    }

    if (e.key === "Backspace" || e.key === "Delete") {
      setTimeout(() => {
        const inputVal = $("#commandLine input").val() as string;
        if (
          Config.singleListCommandLine == "manual" &&
          isSingleListCommandLineActive() &&
          inputVal[0] !== ">"
        ) {
          restoreOldCommandLine(false);
        }
      }, 1);
    }

    if (e.key === "Enter") {
      //enter
      e.preventDefault();
      const command = $(".suggestions .entry.activeKeyboard").attr(
        "command"
      ) as string;
      trigger(command);
      return;
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Tab") {
      e.preventDefault();
      $("#commandLineWrapper #commandLine .suggestions .entry").unbind(
        "mouseenter mouseleave"
      );
      const entries = $(".suggestions .entry");
      let activenum = -1;
      let hoverId: string;
      $.each(entries, (index, obj) => {
        if ($(obj).hasClass("activeKeyboard")) activenum = index;
      });
      if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
        entries.removeClass("activeKeyboard");
        if (activenum == 0) {
          $(entries[entries.length - 1]).addClass("activeKeyboard");
          hoverId = $(entries[entries.length - 1]).attr("command") as string;
        } else {
          $(entries[--activenum]).addClass("activeKeyboard");
          hoverId = $(entries[activenum]).attr("command") as string;
        }
      }
      if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
        entries.removeClass("activeKeyboard");
        if (activenum + 1 == entries.length) {
          $(entries[0]).addClass("activeKeyboard");
          hoverId = $(entries[0]).attr("command") as string;
        } else {
          $(entries[++activenum]).addClass("activeKeyboard");
          hoverId = $(entries[activenum]).attr("command") as string;
        }
      }
      try {
        const scroll =
          Math.abs(
            ($(".suggestions").offset()?.top as number) -
              ($(".entry.activeKeyboard").offset()?.top as number) -
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
      // console.log(`scrolling to ${scroll}`);
      try {
        const list =
          CommandlineLists.current[CommandlineLists.current.length - 1];
        $.each(list.list, (_index, obj) => {
          if (obj.id == hoverId) {
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

$(document).on("click", "#commandLineMobileButton", () => {
  if (Config.singleListCommandLine == "on") {
    useSingleListCommandLine(false);
  } else {
    CommandlineLists.setCurrent([CommandlineLists.defaultCommands]);
  }
  show();
});

$(document).on("click", "#keymap .r5 .key-space", () => {
  CommandlineLists.setCurrent([CommandlineLists.commandsKeymapLayouts]);
  show();
});

$(document).on("click", "#testModesNotice .text-button", (event) => {
  const commands = CommandlineLists.getList(
    $(event.currentTarget).attr("commands") as CommandlineLists.ListsObjectKeys
  );
  if (commands !== undefined) {
    if ($(event.currentTarget).attr("commands") === "commandsTags") {
      CommandlineLists.updateTagCommands();
    }
    CommandlineLists.pushCurrent(commands);
    show();
  }
});

$(document).on("click", "#bottom .leftright .right .current-theme", (e) => {
  if (e.shiftKey) {
    if (!Config.customTheme) {
      if (firebase.auth().currentUser !== null) {
        if (DB.getSnapshot().customThemes.length < 1) {
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
    if (Config.customTheme) CommandlineLists.updateCustomThemeListCommands();
    CommandlineLists.pushCurrent(
      Config.customTheme
        ? CommandlineLists.customThemeListCommands
        : CommandlineLists.themeCommands
    );
    show();
  }
});

$(document.body).on("click", ".pageAbout .aboutEnableAds", () => {
  CommandlineLists.pushCurrent(CommandlineLists.commandsEnableAds);
  show();
});

$(".supportButtons .button.ads").on("click", () => {
  CommandlineLists.pushCurrent(CommandlineLists.commandsEnableAds);
  show();
});
