function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

let commands = {
  title: "",
  list: [
    {
      id: "togglePunctuation",
      display: "Toggle punctuation",
      exec: () => {
        togglePunctuation();
        restartTest();
      },
    },
    {
      id: "changeMode",
      display: "Change mode...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsMode);
        showCommandLine();
      },
    },
    {
      id: "changeTimeConfig",
      display: "Change time config...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsTimeConfig);
        showCommandLine();
      },
    },
    {
      id: "changeWordCount",
      display: "Change word count...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsWordCount);
        showCommandLine();
      },
    },
    {
      visible: false,
      id: "changeTags",
      display: "Change tags...",
      subgroup: true,
      exec: () => {
        updateCommandsTagsList();
        currentCommands.push(commandsTags);
        showCommandLine();
      },
    },
    {
      id: "changeConfidenceMode",
      display: "Change confidence mode...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsConfidenceMode);
        showCommandLine();
      },
    },
    {
      id: "toggleSmoothCaret",
      display: "Toggle smooth caret",
      exec: () => {
        toggleSmoothCaret();
      },
    },
    {
      id: "toggleQuickTab",
      display: "Toggle quick tab mode",
      exec: () => {
        toggleQuickTabMode();
      },
    },
    {
      id: "toggleShowLiveWpm",
      display: "Toggle live wpm display",
      exec: () => {
        toggleShowLiveWpm();
        saveConfigToCookie();
      },
    },
    {
      id: "toggleTimerBar",
      display: "Toggle timer display",
      exec: () => {
        toggleShowTimerProgress();
        saveConfigToCookie();
      },
    },
    {
      id: "toggleKeyTips",
      display: "Toggle keybind tips",
      exec: () => {
        toggleKeyTips();
      },
    },
    {
      id: "toggleFreedom",
      display: "Toggle freedom mode",
      exec: () => {
        toggleFreedomMode();
      },
    },
    {
      id: "toggleBlindMode",
      display: "Toggle blind mode",
      exec: () => {
        toggleBlindMode();
      },
    },
    {
      id: "toggleStopOnError",
      display: "Toggle stop on error",
      exec: () => {
        toggleStopOnError();
      },
    },
    {
      id: "toggleQuickEnd",
      display: "Toggle quick end",
      exec: () => {
        toggleQuickEnd();
      },
    },
    {
      id: "toggleFlipTestColors",
      display: "Toggle flip test colors",
      exec: () => {
        toggleFlipTestColors();
      },
    },
    {
      id: "toggleSmoothLineScroll",
      display: "Toggle smooth line scroll",
      exec: () => {
        toggleSmoothLineScroll();
      },
    },
    {
      id: "toggleAlwaysShowDecimalPlaces",
      display: "Toggle always show decimal places",
      exec: () => {
        toggleAlwaysShowDecimalPlaces();
      },
    },
    {
      id: "toggleShowAllLines",
      display: "Toggle show all lines",
      exec: () => {
        toggleShowAllLines();
      },
    },
    {
      id: "toggleColorfulMode",
      display: "Toggle colorful mode",
      exec: () => {
        toggleColorfulMode();
      },
    },
    {
      id: "toggleRandomTheme",
      display: "Toggle random theme",
      exec: () => {
        toggleRandomTheme();
      },
    },
    {
      id: "togglePresetCustomTheme",
      display: "Toggle preset/custom theme",
      exec: () => {
        togglePresetCustomTheme();
      },
    },
    {
      id: "changeDifficulty",
      display: "Change difficulty...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsDifficulty);
        showCommandLine();
      },
    },
    {
      id: "changeCaretStyle",
      display: "Change caret style...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsCaretStyle);
        showCommandLine();
      },
    },
    {
      id: "changeTimerStyle",
      display: "Change timer/progress style...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsTimerStyle);
        showCommandLine();
      },
    },
    {
      id: "changeTimerColor",
      display: "Change timer/progress color...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsTimerColor);
        showCommandLine();
      },
    },
    {
      id: "changeTimerOpacity",
      display: "Change timer/progress opacity...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsTimerOpacity);
        showCommandLine();
      },
    },
    {
      id: "changeTheme",
      display: "Change theme...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsThemes);
        showCommandLine();
      },
    },
    {
      id: "changeLanguage",
      display: "Change language...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsLanguages);
        showCommandLine();
      },
    },
    {
      id: "changeFunbox",
      display: "Change funbox...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsFunbox);
        showCommandLine();
      },
    },
    {
      id: "changeLayout",
      display: "Change layout...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsLayouts);
        showCommandLine();
      },
    },
    {
      id: "toggleKeymap",
      display: "Change keymap mode...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsKeymapMode);
        showCommandLine();
      },
    },
    {
      id: "changeKeymapStyle",
      display: "Change keymap style...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsKeymapStyle);
        showCommandLine();
      },
    },
    {
      id: "changeKeymapLayout",
      display: "Change keymap layout...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsKeymapLayouts);
        showCommandLine();
      },
    },
    {
      id: "changeFontSize",
      display: "Change font size...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsFontSize);
        showCommandLine();
      },
    },
    {
      id: "changeFontFamily",
      display: "Change font family...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsFonts);
        showCommandLine();
      },
    },
    {
      id: "bailOut",
      display: "Bail out...",
      exec: () => {
        currentCommands = {
          title: "Are you sure...",
          list: [
            {
              id: "bailOutForSure",
              display: "Yes, im sure",
              exec: () => {
                bailout = true;
                showResult();
              },
            },
          ],
        };
      },
    },
    {
      id: "joinDiscord",
      display: "Join the Discord server",
      exec: () => {
        window.open("https://discord.gg/yENzqcB");
      },
    },
  ],
};

let commandsKeymapMode = {
  title: "Change keymap mode...",
  list: [
    {
      id: "setKeymapModeOff",
      display: "off",
      exec: () => {
        changeKeymapMode("off");
      },
    },
    {
      id: "setKeymapModeNext",
      display: "next",
      exec: () => {
        changeKeymapMode("next");
      },
    },
    {
      id: "setKeymapModeReact",
      display: "react",
      exec: () => {
        changeKeymapMode("react");
      },
    },
  ],
};

let commandsDifficulty = {
  title: "Change difficulty...",
  list: [
    {
      id: "setDifficultyNormal",
      display: "Normal",
      exec: () => {
        setDifficulty("normal");
      },
    },
    {
      id: "setDifficultyExpert",
      display: "Expert",
      exec: () => {
        setDifficulty("expert");
      },
    },
    {
      id: "setDifficultyMaster",
      display: "Master",
      exec: () => {
        setDifficulty("master");
      },
    },
  ],
};

let commandsCaretStyle = {
  title: "Change caret...",
  list: [
    {
      id: "setCaretStyleDefault",
      display: "line",
      exec: () => {
        setCaretStyle("default");
      },
    },
    {
      id: "setCaretStyleBlock",
      display: "block",
      exec: () => {
        setCaretStyle("block");
      },
    },
    {
      id: "setCaretStyleOutline",
      display: "outline-block",
      exec: () => {
        setCaretStyle("outline");
      },
    },
    {
      id: "setCaretStyleUnderline",
      display: "underline",
      exec: () => {
        setCaretStyle("underline");
      },
    },
  ],
};

let commandsKeymapStyle = {
  title: "Change keymap style...",
  list: [
    {
      id: "setKeymapStyleStaggered",
      display: "staggered",
      exec: () => {
        changeKeymapStyle("staggered");
      },
    },
    {
      id: "setKeymapStyleMatrix",
      display: "matrix",
      exec: () => {
        changeKeymapStyle("matrix");
      },
    },
    {
      id: "setKeymapStyleSplit",
      display: "split",
      exec: () => {
        changeKeymapStyle("split");
      },
    },
    {
      id: "setKeymapStyleSplitMatrix",
      display: "split matrix",
      exec: () => {
        changeKeymapStyle("split_matrix");
      },
    },
  ],
};

let commandsTimerStyle = {
  title: "Change timer/progress style...",
  list: [
    {
      id: "setTimerStyleBar",
      display: "bar",
      exec: () => {
        setTimerStyle("bar");
      },
    },
    {
      id: "setTimerStyleText",
      display: "text",
      exec: () => {
        setTimerStyle("text");
      },
    },
  ],
};

let commandsTimerColor = {
  title: "Change timer/progress color...",
  list: [
    {
      id: "setTimerColorBlack",
      display: "black",
      exec: () => {
        setTimerColor("bar");
      },
    },
    {
      id: "setTimerColorSub",
      display: "sub",
      exec: () => {
        setTimerColor("sub");
      },
    },
    {
      id: "setTimerColorText",
      display: "text",
      exec: () => {
        setTimerColor("text");
      },
    },
    {
      id: "setTimerColorMain",
      display: "main",
      exec: () => {
        setTimerColor("main");
      },
    },
  ],
};

let commandsTimerOpacity = {
  title: "Change timer opacity...",
  list: [
    {
      id: "setTimerOpacity.25",
      display: ".25",
      exec: () => {
        setTimerOpacity(0.25);
      },
    },
    {
      id: "setTimerOpacity.5",
      display: ".5",
      exec: () => {
        setTimerOpacity(0.5);
      },
    },
    {
      id: "setTimerOpacity.75",
      display: ".75",
      exec: () => {
        setTimerOpacity(0.75);
      },
    },
    {
      id: "setTimerOpacity1",
      display: "1",
      exec: () => {
        setTimerOpacity(1);
      },
    },
  ],
};

let commandsWordCount = {
  title: "Change word count...",
  list: [
    {
      id: "changeWordCount10",
      display: "10",
      exec: () => {
        changeWordCount("10");
        restartTest();
      },
    },
    {
      id: "changeWordCount25",
      display: "25",
      exec: () => {
        changeWordCount("25");
        restartTest();
      },
    },
    {
      id: "changeWordCount50",
      display: "50",
      exec: () => {
        changeWordCount("50");
        restartTest();
      },
    },
    {
      id: "changeWordCount100",
      display: "100",
      exec: () => {
        changeWordCount("100");
        restartTest();
      },
    },
    {
      id: "changeWordCount200",
      display: "200",
      exec: () => {
        changeWordCount("200");
        restartTest();
      },
    },
  ],
};
let commandsMode = {
  title: "Change mode...",
  list: [
    {
      id: "changeModeTime",
      display: "time",
      exec: () => {
        changeMode("time");
        restartTest();
      },
    },
    {
      id: "changeModeWords",
      display: "words",
      exec: () => {
        changeMode("words");
        restartTest();
      },
    },
    {
      id: "changeModeQuote",
      display: "quote",
      exec: () => {
        changeMode("quote");
        restartTest();
      },
    },
    {
      id: "changeModeCustom",
      display: "custom",
      exec: () => {
        changeMode("custom");
        restartTest();
      },
    },
  ],
};
let commandsTimeConfig = {
  title: "Change time config...",
  list: [
    {
      id: "changeTimeConfig15",
      display: "15",
      exec: () => {
        changeTimeConfig("15");
        restartTest();
      },
    },
    {
      id: "changeTimeConfig30",
      display: "30",
      exec: () => {
        changeTimeConfig("30");
        restartTest();
      },
    },
    {
      id: "changeTimeConfig60",
      display: "60",
      exec: () => {
        changeTimeConfig("60");
        restartTest();
      },
    },
    {
      id: "changeTimeConfig120",
      display: "120",
      exec: () => {
        changeTimeConfig("120");
        restartTest();
      },
    },
  ],
};

let commandsConfidenceMode = {
  title: "Change confidence mode...",
  list: [
    {
      id: "changeConfidenceModeOff",
      display: "off",
      exec: () => {
        setConfidenceMode("off");
      },
    },
    {
      id: "changeConfidenceModeOn",
      display: "on",
      exec: () => {
        setConfidenceMode("on");
      },
    },
    {
      id: "changeConfidenceModeMax",
      display: "max",
      exec: () => {
        setConfidenceMode("max");
      },
    },
  ],
};

let commandsFontSize = {
  title: "Change font size...",
  list: [
    {
      id: "changeFontSize1",
      display: "1x",
      exec: () => {
        changeFontSize(1);
        restartTest();
      },
    },
    {
      id: "changeFontSize125",
      display: "1.25x",
      exec: () => {
        changeFontSize(125);
        restartTest();
      },
    },
    {
      id: "changeFontSize15",
      display: "1.5x",
      exec: () => {
        changeFontSize(15);
        restartTest();
      },
    },
    {
      id: "changeFontSize2",
      display: "2x",
      exec: () => {
        changeFontSize(2);
        restartTest();
      },
    },
  ],
};

let commandsTags = {
  title: "Change tags...",
  list: [],
};

function updateCommandsTagsList() {
  if (dbSnapshot.tags.length > 0) {
    commandsTags.list = [];
    dbSnapshot.tags.forEach((tag) => {
      let dis = tag.name;

      if (tag.active === true) {
        dis = '<i class="fas fa-check-square"></i>' + dis;
      } else {
        dis = '<i class="fas fa-square"></i>' + dis;
      }

      commandsTags.list.push({
        id: "toggleTag" + tag.id,
        display: dis,
        sticky: true,
        exec: () => {
          toggleTag(tag.id);
          updateTestModesNotice();
          let txt = tag.name;

          if (tag.active === true) {
            txt = '<i class="fas fa-check-square"></i>' + txt;
          } else {
            txt = '<i class="fas fa-square"></i>' + txt;
          }
          $(
            `#commandLine .suggestions .entry[command='toggleTag${tag.id}']`
          ).html(txt);
        },
      });
    });
    commands.list[4].visible = true;
  }
}

getThemesList().then((themes) => {
  themes.forEach((theme) => {
    commandsThemes.list.push({
      id: "changeTheme" + capitalizeFirstLetter(theme.name),
      display: theme.name.replace(/_/g, " "),
      hover: () => {
        previewTheme(theme.name);
      },
      exec: () => {
        setTheme(theme.name);
      },
    });
  });
});

let commandsFonts = {
  title: "Change font...",
  list: [],
};

getFontsList().then((fonts) => {
  fonts.forEach((font) => {
    commandsFonts.list.push({
      id: "changeFont" + font.name.replace(/ /g, "_"),
      display: font.display !== undefined ? font.display : font.name,
      exec: () => {
        setFontFamily(font.name.replace(/ /g, "_"));
      },
    });
  });
});

let commandsFunbox = {
  title: "Change funbox...",
  list: [
    {
      id: "changeFunboxNone",
      display: "none",
      exec: () => {
        if (activateFunbox("none", null)) {
          restartTest();
        }
      },
    },
  ],
};

getFunboxList().then((funboxes) => {
  funboxes.forEach((funbox) => {
    commandsFunbox.list.push({
      id: "changeFunbox" + funbox.name,
      display: funbox.name.replace(/_/g, " "),
      exec: () => {
        if (activateFunbox(funbox.name, funbox.type)) {
          restartTest();
        }
      },
    });
  });
});

let commandsThemes = {
  title: "Change theme...",
  list: [],
};

let commandsLanguages = {
  title: "Change language...",
  list: [
    {
      id: "couldnotload",
      display: "Could not load the languages list :(",
    },
  ],
};

if (Object.keys(words).length > 0) {
  commandsLanguages.list = [];
  Object.keys(words).forEach((language) => {
    if (language === "english_10k") return;
    commandsLanguages.list.push({
      id: "changeLanguage" + capitalizeFirstLetter(language),
      display: language.replace(/_/g, " "),
      exec: () => {
        changeLanguage(language);
        restartTest();
        saveConfigToCookie();
      },
    });
    if (language === "english_expanded") {
      commandsLanguages.list.push({
        id: "changeLanguageEnglish10k",
        display: "english 10k",
        exec: () => {
          changeLanguage("english_10k");
          restartTest();
          saveConfigToCookie();
        },
      });
    }
  });
}

let commandsLayouts = {
  title: "Change layout...",
  list: [
    {
      id: "couldnotload",
      display: "Could not load the layouts list :(",
    },
  ],
};

if (Object.keys(layouts).length > 0) {
  commandsLayouts.list = [];
  Object.keys(layouts).forEach((layout) => {
    commandsLayouts.list.push({
      id: "changeLayout" + capitalizeFirstLetter(layout),
      display: layout.replace(/_/g, " "),
      exec: () => {
        changeLayout(layout);
        restartTest();
        saveConfigToCookie();
      },
    });
  });
}

let commandsKeymapLayouts = {
  title: "Change keymap layout...",
  list: [
    {
      id: "couldnotload",
      display: "Could not load the layouts list :(",
    },
  ],
};

if (Object.keys(layouts).length > 0) {
  commandsKeymapLayouts.list = [];
  Object.keys(layouts).forEach((layout) => {
    if (layout.toString() != "default") {
      commandsKeymapLayouts.list.push({
        id: "changeLayout" + capitalizeFirstLetter(layout),
        display: layout.replace("_", " "),
        exec: () => {
          changeKeymapLayout(layout);
          restartTest();
          saveConfigToCookie();
        },
      });
    }
  });
}

$("#commandLine input").keyup((e) => {
  if (e.keyCode == 38 || e.keyCode == 40 || e.keyCode == 13) return;
  updateSuggestedCommands();
});

$(document).ready((e) => {
  $(document).keydown((event) => {
    //escape
    if (event.keyCode == 27) {
      if ($("#commandLineWrapper").hasClass("hidden")) {
        currentCommands = [commands];
        showCommandLine();
      } else {
        if (currentCommands.length > 1) {
          currentCommands.pop();
          showCommandLine();
        } else {
          hideCommandLine();
        }
        if (config.customTheme === true) {
          setCustomTheme();
        } else {
          setTheme(config.theme);
        }
      }
    }
  });
});

$("#commandInput textarea").keydown((e) => {
  if (e.keyCode == 13 && e.shiftKey) {
    //enter
    e.preventDefault();
    let command = $("#commandInput textarea").attr("command");
    let value = $("#commandInput textarea").val();
    let list = currentCommands[currentCommands.length - 1];
    $.each(list.list, (i, obj) => {
      if (obj.id == command) {
        obj.exec(value);
        if (obj.subgroup !== null && obj.subgroup !== undefined) {
          subgroup = obj.subgroup;
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
    hideCommandLine();
  }
  return;
});

$("#commandLineWrapper #commandLine .suggestions").on("mouseover", (e) => {
  $("#commandLineWrapper #commandLine .suggestions .entry").removeClass(
    "active"
  );
  let hoverId = $(e.target).attr("command");
  try {
    let list = currentCommands[currentCommands.length - 1];
    $.each(list.list, (index, obj) => {
      if (obj.id == hoverId) {
        obj.hover();
      }
    });
  } catch (e) {}
});

$("#commandLineWrapper #commandLine .suggestions").click((e) => {
  triggerCommand($(e.target).attr("command"));
});

$("#commandLineWrapper").click((e) => {
  if ($(e.target).attr("id") === "commandLineWrapper") {
    hideCommandLine();
  }
});

$(document).keydown((e) => {
  if (!$("#commandLineWrapper").hasClass("hidden")) {
    $("#commandLine input").focus();
    if (e.keyCode == 13) {
      //enter
      e.preventDefault();
      let command = $(".suggestions .entry.activeKeyboard").attr("command");
      triggerCommand(command);
      return;
    }
    if (e.keyCode == 38 || e.keyCode == 40) {
      $("#commandLineWrapper #commandLine .suggestions .entry").unbind(
        "mouseenter mouseleave"
      );
      let entries = $(".suggestions .entry");
      let activenum = -1;
      let hoverId;
      $.each(entries, (index, obj) => {
        if ($(obj).hasClass("activeKeyboard")) activenum = index;
      });
      if (e.keyCode == 38) {
        entries.removeClass("activeKeyboard");
        if (activenum == 0) {
          $(entries[entries.length - 1]).addClass("activeKeyboard");
          hoverId = $(entries[entries.length - 1]).attr("command");
        } else {
          $(entries[--activenum]).addClass("activeKeyboard");
          hoverId = $(entries[activenum]).attr("command");
        }
      }
      if (e.keyCode == 40) {
        entries.removeClass("activeKeyboard");
        if (activenum + 1 == entries.length) {
          $(entries[0]).addClass("activeKeyboard");
          hoverId = $(entries[0]).attr("command");
        } else {
          $(entries[++activenum]).addClass("activeKeyboard");
          hoverId = $(entries[activenum]).attr("command");
        }
      }
      let scroll =
        Math.abs(
          $(".suggestions").offset().top -
            $(".entry.activeKeyboard").offset().top -
            $(".suggestions").scrollTop()
        ) -
        $(".suggestions").outerHeight() / 2 +
        $($(".entry")[0]).outerHeight();
      $(".suggestions").scrollTop(scroll);
      // console.log(`scrolling to ${scroll}`);
      try {
        let list = currentCommands[currentCommands.length - 1];
        $.each(list.list, (index, obj) => {
          if (obj.id == hoverId) {
            obj.hover();
          }
        });
      } catch (e) {}

      return false;
    }
  }
});

let currentCommands = [commands];

function triggerCommand(command) {
  let subgroup = false;
  let input = false;
  let list = currentCommands[currentCommands.length - 1];
  let sticky = false;
  $.each(list.list, (i, obj) => {
    if (obj.id == command) {
      if (obj.input) {
        input = true;
        showCommandInput(obj.id, obj.display);
      } else {
        obj.exec();
        if (obj.subgroup !== null && obj.subgroup !== undefined) {
          subgroup = obj.subgroup;
        }
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
    hideCommandLine();
  }
}

function hideCommandLine() {
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
      }
    );
  focusWords();
}

function showCommandLine() {
  setFocus(false);
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
  updateSuggestedCommands();
  $("#commandLine input").focus();
}

function showCommandInput(command, placeholder) {
  $("#commandLineWrapper").removeClass("hidden");
  $("#commandLine").addClass("hidden");
  $("#commandInput").removeClass("hidden");
  $("#commandInput textarea").attr("placeholder", placeholder);
  $("#commandInput textarea").val("");
  $("#commandInput textarea").focus();
  $("#commandInput textarea").attr("command", "");
  $("#commandInput textarea").attr("command", command);
}

function updateSuggestedCommands() {
  let inputVal = $("#commandLine input").val().toLowerCase().split(" ");
  let list = currentCommands[currentCommands.length - 1];
  if (inputVal[0] == "") {
    $.each(list.list, (index, obj) => {
      if (obj.visible !== false) obj.found = true;
    });
  } else {
    $.each(list.list, (index, obj) => {
      let foundcount = 0;
      $.each(inputVal, (index2, obj2) => {
        if (obj2 == "") return;
        let re = new RegExp("\\b" + obj2, "g");
        let res = obj.display.toLowerCase().match(re);
        if (res != null && res.length > 0) {
          foundcount++;
        } else {
          foundcount--;
        }
      });
      if (foundcount > 0) {
        if (obj.visible !== false) obj.found = true;
      } else {
        obj.found = false;
      }
    });
  }
  displayFoundCommands();
}

function displayFoundCommands() {
  $("#commandLine .suggestions").empty();
  let list = currentCommands[currentCommands.length - 1];
  $.each(list.list, (index, obj) => {
    if (obj.found) {
      $("#commandLine .suggestions").append(
        '<div class="entry" command="' + obj.id + '">' + obj.display + "</div>"
      );
    }
  });
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
          obj.hover();
          return false;
        }
      });
    } catch (e) {}
  }
  $("#commandLine .listTitle").remove();
  // if(currentCommands.title != ''){
  //   $("#commandLine .suggestions").before("<div class='listTitle'>"+currentCommands.title+"</div>");
  // }
}
