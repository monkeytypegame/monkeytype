import * as Leaderboards from "./leaderboards";
import * as ThemeController from "./theme-controller";
import Config, * as UpdateConfig from "./config";
import * as Focus from "./focus";
import * as CommandlineLists from "./commandline-lists";
import * as TestUI from "./test-ui";
import * as PractiseWords from "./practise-words";
import * as SimplePopups from "./simple-popups";
import * as CustomWordAmountPopup from "./custom-word-amount-popup";
import * as CustomTestDurationPopup from "./custom-test-duration-popup";
import * as CustomTextPopup from "./custom-text-popup";

let commandLineMouseMode = false;

function showInput(command, placeholder, defaultValue = "") {
  $("#commandLineWrapper").removeClass("hidden");
  $("#commandLine").addClass("hidden");
  $("#commandInput").removeClass("hidden");
  $("#commandInput input").attr("placeholder", placeholder);
  $("#commandInput input").val(defaultValue);
  $("#commandInput input").focus();
  $("#commandInput input").attr("command", "");
  $("#commandInput input").attr("command", command);
  if (defaultValue != "") {
    $("#commandInput input").select();
  }
}

export function isSingleListCommandLineActive() {
  return $("#commandLine").hasClass("allCommands");
}

function showFound() {
  $("#commandLine .suggestions").empty();
  let commandsHTML = "";
  let list = CommandlineLists.current[CommandlineLists.current.length - 1];
  $.each(list.list, (index, obj) => {
    if (obj.found && (obj.available !== undefined ? obj.available() : true)) {
      let icon = obj.icon ?? "fa-chevron-right";
      let faIcon = /^fa-/g.test(icon);
      if (!faIcon) {
        icon = `<div class="textIcon">${icon}</div>`;
      } else {
        icon = `<i class="fas fa-fw ${icon}"></i>`;
      }
      if (list.configKey) {
        if (
          (obj.configValueMode &&
            obj.configValueMode === "include" &&
            Config[list.configKey].includes(obj.configValue)) ||
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
  let entries = $("#commandLine .suggestions .entry");
  if (entries.length > 0) {
    $(entries[0]).addClass("activeKeyboard");
    try {
      $.each(list.list, (index, obj) => {
        if (obj.found) {
          if (
            (!/theme/gi.test(obj.id) || obj.id === "toggleCustomTheme") &&
            !ThemeController.randomTheme
          )
            ThemeController.clearPreview();
          if (!/font/gi.test(obj.id))
            UpdateConfig.previewFontFamily(Config.fontFamily);
          obj.hover();
          return false;
        }
      });
    } catch (e) {}
  }
  $("#commandLine .listTitle").remove();
}

function updateSuggested() {
  let inputVal = $("#commandLine input")
    .val()
    .toLowerCase()
    .split(" ")
    .filter((s, i) => s || i == 0); //remove empty entries after first
  let list = CommandlineLists.current[CommandlineLists.current.length - 1];
  if (
    inputVal[0] === "" &&
    Config.singleListCommandLine === "on" &&
    CommandlineLists.current.length === 1
  ) {
    $.each(list.list, (index, obj) => {
      obj.found = false;
    });
    showFound();
    return;
  }
  //ignore the preceeding ">"s in the command line input
  if (inputVal[0] && inputVal[0][0] == ">")
    inputVal[0] = inputVal[0].replace(/^>+/, "");
  if (inputVal[0] == "" && inputVal.length == 1) {
    $.each(list.list, (index, obj) => {
      if (obj.visible !== false) obj.found = true;
    });
  } else {
    $.each(list.list, (index, obj) => {
      let foundcount = 0;
      $.each(inputVal, (index2, obj2) => {
        if (obj2 == "") return;
        let escaped = obj2.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        let re = new RegExp("\\b" + escaped, "g");
        let res = obj.display.toLowerCase().match(re);
        let res2 =
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

export let show = () => {
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
  updateSuggested();
  $("#commandLine input").focus();
};

function hide() {
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

function trigger(command) {
  let subgroup = false;
  let input = false;
  let list = CommandlineLists.current[CommandlineLists.current.length - 1];
  let sticky = false;
  $.each(list.list, (i, obj) => {
    if (obj.id == command) {
      if (obj.input) {
        input = true;
        let escaped = obj.display.split("</i>")[1] ?? obj.display;
        showInput(obj.id, escaped, obj.defaultValue);
      } else if (obj.subgroup) {
        subgroup = true;
        if (obj.beforeSubgroup) {
          obj.beforeSubgroup();
        }
        CommandlineLists.current.push(obj.subgroup);
        show();
      } else {
        obj.exec();
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

function addChildCommands(
  unifiedCommands,
  commandItem,
  parentCommandDisplay = "",
  parentCommand = ""
) {
  let commandItemDisplay = commandItem.display.replace(/\s?\.\.\.$/g, "");
  let icon = `<i class="fas fa-fw"></i>`;
  if (
    commandItem.configValue !== undefined &&
    Config[parentCommand.configKey] === commandItem.configValue
  ) {
    icon = `<i class="fas fa-fw fa-check"></i>`;
  }
  if (commandItem.noIcon) {
    icon = "";
  }

  if (parentCommandDisplay)
    commandItemDisplay =
      parentCommandDisplay + " > " + icon + commandItemDisplay;
  if (commandItem.subgroup) {
    if (commandItem.beforeSubgroup) commandItem.beforeSubgroup();
    try {
      commandItem.subgroup.list.forEach((cmd) => {
        commandItem.configKey = commandItem.subgroup.configKey;
        addChildCommands(unifiedCommands, cmd, commandItemDisplay, commandItem);
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
    let tempCommandItem = { ...commandItem };
    tempCommandItem.icon = parentCommand.icon;
    if (parentCommandDisplay) tempCommandItem.display = commandItemDisplay;
    unifiedCommands.push(tempCommandItem);
  }
}

function generateSingleListOfCommands() {
  const allCommands = [];
  const oldShowCommandLine = show;
  show = () => {};
  CommandlineLists.defaultCommands.list.forEach((c) =>
    addChildCommands(allCommands, c)
  );
  show = oldShowCommandLine;
  return {
    title: "All Commands",
    list: allCommands,
  };
}

function useSingleListCommandLine(sshow = true) {
  let allCommands = generateSingleListOfCommands();
  // if (Config.singleListCommandLine == "manual") {
  // CommandlineLists.pushCurrent(allCommands);
  // } else if (Config.singleListCommandLine == "on") {
  CommandlineLists.setCurrent([allCommands]);
  // }
  if (Config.singleListCommandLine != "off")
    $("#commandLine").addClass("allCommands");
  if (sshow) show();
}

function restoreOldCommandLine(sshow = true) {
  if (isSingleListCommandLineActive()) {
    $("#commandLine").removeClass("allCommands");
    CommandlineLists.setCurrent(
      CommandlineLists.current.filter((l) => l.title != "All Commands")
    );
    if (CommandlineLists.current.length < 1)
      CommandlineLists.setCurrent([CommandlineLists.defaultCommands]);
  }
  if (sshow) show();
}

$("#commandLine input").keyup((e) => {
  commandLineMouseMode = false;
  $("#commandLineWrapper #commandLine .suggestions .entry").removeClass(
    "activeMouse"
  );
  console.log(e);
  if (
    e.key === "ArrowUp" ||
    e.key === "ArrowDown" ||
    e.key === "Enter" ||
    e.key === "Tab" ||
    e.code == "AltLeft" ||
    (e.key.length > 1 && e.key !== "Backspace" && e.key !== "Delete")
  )
    return;
  updateSuggested();
});

$(document).ready((e) => {
  $(document).keydown((event) => {
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
      if (!$("#leaderboardsWrapper").hasClass("hidden")) {
        //maybe add more condition for closing other dialogs in the future as well
        event.preventDefault();
        Leaderboards.hide();
      } else if (!$("#practiseWordsPopupWrapper").hasClass("hidden")) {
        event.preventDefault();
        PractiseWords.hide();
      } else if (!$("#simplePopupWrapper").hasClass("hidden")) {
        event.preventDefault();
        SimplePopups.hide();
      } else if (!$("#customWordAmountPopupWrapper").hasClass("hidden")) {
        event.preventDefault();
        CustomWordAmountPopup.hide();
      } else if (!$("#customTestDurationPopupWrapper").hasClass("hidden")) {
        event.preventDefault();
        CustomTestDurationPopup.hide();
      } else if (!$("#customTextPopupWrapper").hasClass("hidden")) {
        event.preventDefault();
        CustomTextPopup.hide();
      } else if (!$("#commandLineWrapper").hasClass("hidden")) {
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

$("#commandInput input").keydown((e) => {
  if (e.key === "Enter") {
    //enter
    e.preventDefault();
    let command = $("#commandInput input").attr("command");
    let value = $("#commandInput input").val();
    let list = CommandlineLists.current[CommandlineLists.current.length - 1];
    $.each(list.list, (i, obj) => {
      if (obj.id == command) {
        obj.exec(value);
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
  let hoverId = $(e.target).attr("command");
  try {
    let list = CommandlineLists.current[CommandlineLists.current.length - 1];
    $.each(list.list, (index, obj) => {
      if (obj.id == hoverId) {
        if (
          (!/theme/gi.test(obj.id) || obj.id === "toggleCustomTheme") &&
          !ThemeController.randomTheme
        )
          ThemeController.clearPreview();
        if (!/font/gi.test(obj.id))
          UpdateConfig.previewFontFamily(Config.fontFamily);
        obj.hover();
      }
    });
  } catch (e) {}
});

$(document).on(
  "click",
  "#commandLineWrapper #commandLine .suggestions .entry",
  (e) => {
    $(".suggestions .entry").removeClass("activeKeyboard");
    trigger($(e.currentTarget).attr("command"));
  }
);

$("#commandLineWrapper").click((e) => {
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
//   activeEntries.each((index, activeEntry) => {
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
// $(document).keydown((e) => {
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

$(document).keydown((e) => {
  // if (isPreviewingTheme) {
  // console.log("applying theme");
  // applyCustomThemeColors();
  // previewTheme(Config.theme, false);
  // }
  if (!$("#commandLineWrapper").hasClass("hidden")) {
    $("#commandLine input").focus();
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
        let inputVal = $("#commandLine input").val();
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
      let command = $(".suggestions .entry.activeKeyboard").attr("command");
      trigger(command);
      return;
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Tab") {
      e.preventDefault();
      $("#commandLineWrapper #commandLine .suggestions .entry").unbind(
        "mouseenter mouseleave"
      );
      let entries = $(".suggestions .entry");
      let activenum = -1;
      let hoverId;
      $.each(entries, (index, obj) => {
        if ($(obj).hasClass("activeKeyboard")) activenum = index;
      });
      if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
        entries.removeClass("activeKeyboard");
        if (activenum == 0) {
          $(entries[entries.length - 1]).addClass("activeKeyboard");
          hoverId = $(entries[entries.length - 1]).attr("command");
        } else {
          $(entries[--activenum]).addClass("activeKeyboard");
          hoverId = $(entries[activenum]).attr("command");
        }
      }
      if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
        entries.removeClass("activeKeyboard");
        if (activenum + 1 == entries.length) {
          $(entries[0]).addClass("activeKeyboard");
          hoverId = $(entries[0]).attr("command");
        } else {
          $(entries[++activenum]).addClass("activeKeyboard");
          hoverId = $(entries[activenum]).attr("command");
        }
      }
      try {
        let scroll =
          Math.abs(
            $(".suggestions").offset().top -
              $(".entry.activeKeyboard").offset().top -
              $(".suggestions").scrollTop()
          ) -
          $(".suggestions").outerHeight() / 2 +
          $($(".entry")[0]).outerHeight();
        $(".suggestions").scrollTop(scroll);
      } catch (e) {
        console.log("could not scroll suggestions: " + e.message);
      }
      // console.log(`scrolling to ${scroll}`);
      try {
        let list =
          CommandlineLists.current[CommandlineLists.current.length - 1];
        $.each(list.list, (index, obj) => {
          if (obj.id == hoverId) {
            if (
              (!/theme/gi.test(obj.id) || obj.id === "toggleCustomTheme") &&
              !ThemeController.randomTheme
            )
              ThemeController.clearPreview();
            if (!/font/gi.test(obj.id))
              UpdateConfig.previewFontFamily(Config.fontFamily);
            obj.hover();
          }
        });
      } catch (e) {}

      return false;
    }
  }
});

$(document).on("click", "#commandLineMobileButton", () => {
  CommandlineLists.setCurrent([CommandlineLists.defaultCommands]);
  show();
});
