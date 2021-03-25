let currentCommands = [commands];

let showCommandLine = () => {
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
  updateSuggestedCommands();
  $("#commandLine input").focus();
};

let commandsPageWidth = {
  title: "Change page width...",
  list: [
    {
      id: "setPageWidth100",
      display: "100",
      exec: () => {
        UpdateConfig.setPageWidth("100");
      },
    },
    {
      id: "setPageWidth125",
      display: "125",
      exec: () => {
        UpdateConfig.setPageWidth("125");
      },
    },
    {
      id: "setPageWidth150",
      display: "150",
      exec: () => {
        UpdateConfig.setPageWidth("150");
      },
    },
    {
      id: "setPageWidth200",
      display: "200",
      exec: () => {
        UpdateConfig.setPageWidth("200");
      },
    },
    {
      id: "setPageWidthMax",
      display: "max",
      exec: () => {
        UpdateConfig.setPageWidth("max");
      },
    },
  ],
};

let commandsRepeatQuotes = {
  title: "Change repeat quotes...",
  list: [
    {
      id: "setRepeatQuotesOff",
      display: "off",
      exec: () => {
        UpdateConfig.setRepeatQuotes("off");
      },
    },
    {
      id: "setRepeatQuotesTyping",
      display: "typing",
      exec: () => {
        UpdateConfig.setRepeatQuotes("typing");
      },
    },
  ],
};

let commandsOppositeShiftMode = {
  title: "Change opposite shift mode...",
  list: [
    {
      id: "setOppositeShiftModeOff",
      display: "off",
      exec: () => {
        UpdateConfig.setOppositeShiftMode("off");
      },
    },
    {
      id: "setOppositeShiftModeOn",
      display: "on",
      exec: () => {
        UpdateConfig.setOppositeShiftMode("on");
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
        UpdateConfig.setKeymapMode("off");
      },
    },
    {
      id: "setKeymapModeStatic",
      display: "static",
      exec: () => {
        UpdateConfig.setKeymapMode("static");
      },
    },
    {
      id: "setKeymapModeNext",
      display: "next",
      exec: () => {
        UpdateConfig.setKeymapMode("next");
      },
    },
    {
      id: "setKeymapModeReact",
      display: "react",
      exec: () => {
        UpdateConfig.setKeymapMode("react");
      },
    },
  ],
};

let commandsSoundOnClick = {
  title: "Change sound on click...",
  list: [
    {
      id: "setSoundOnClickOff",
      display: "off",
      exec: () => {
        UpdateConfig.setPlaySoundOnClick("off");
      },
    },
    {
      id: "setSoundOnClick1",
      display: "1",
      exec: () => {
        UpdateConfig.setPlaySoundOnClick("1");
        Sound.playClick(Config.playSoundOnClick);
      },
    },
    {
      id: "setSoundOnClick2",
      display: "2",
      exec: () => {
        UpdateConfig.setPlaySoundOnClick("2");
        Sound.playClick(Config.playSoundOnClick);
      },
    },
    {
      id: "setSoundOnClick3",
      display: "3",
      exec: () => {
        UpdateConfig.setPlaySoundOnClick("3");
        Sound.playClick(Config.playSoundOnClick);
      },
    },
    {
      id: "setSoundOnClick4",
      display: "4",
      exec: () => {
        UpdateConfig.setPlaySoundOnClick("4");
        Sound.playClick(Config.playSoundOnClick);
      },
    },
  ],
};

let commandsRandomTheme = {
  title: "Change random theme...",
  list: [
    {
      id: "setRandomOff",
      display: "off",
      exec: () => {
        UpdateConfig.setRandomTheme("off");
      },
    },
    {
      id: "setRandomOn",
      display: "on",
      exec: () => {
        UpdateConfig.setRandomTheme("on");
      },
    },
    {
      id: "setRandomFav",
      display: "fav",
      exec: () => {
        UpdateConfig.setRandomTheme("fav");
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
        UpdateConfig.setDifficulty("normal");
      },
    },
    {
      id: "setDifficultyExpert",
      display: "Expert",
      exec: () => {
        UpdateConfig.setDifficulty("expert");
      },
    },
    {
      id: "setDifficultyMaster",
      display: "Master",
      exec: () => {
        UpdateConfig.setDifficulty("master");
      },
    },
  ],
};

let commandsEnableAds = {
  title: "Set enable ads...",
  list: [
    {
      id: "setEnableAdsOff",
      display: "off",
      exec: () => {
        UpdateConfig.setEnableAds("off");
        Notifications.add("Don't forget to refresh the page!", 0);
      },
    },
    {
      id: "setEnableAdsOn",
      display: "on",
      exec: () => {
        UpdateConfig.setEnableAds("on");
        Notifications.add("Don't forget to refresh the page!", 0);
      },
    },
    {
      id: "setEnableMax",
      display: "Sellout",
      exec: () => {
        UpdateConfig.setEnableAds("max");
        Notifications.add("Don't forget to refresh the page!", 0);
      },
    },
  ],
};

let commandsCaretStyle = {
  title: "Change caret style...",
  list: [
    {
      id: "setCaretStyleOff",
      display: "off",
      exec: () => {
        UpdateConfig.setCaretStyle("off");
      },
    },
    {
      id: "setCaretStyleDefault",
      display: "line",
      exec: () => {
        UpdateConfig.setCaretStyle("default");
      },
    },
    {
      id: "setCaretStyleBlock",
      display: "block",
      exec: () => {
        UpdateConfig.setCaretStyle("block");
      },
    },
    {
      id: "setCaretStyleOutline",
      display: "outline-block",
      exec: () => {
        UpdateConfig.setCaretStyle("outline");
      },
    },
    {
      id: "setCaretStyleUnderline",
      display: "underline",
      exec: () => {
        UpdateConfig.setCaretStyle("underline");
      },
    },
    {
      id: "setCaretStyleCarrot",
      display: "carrot",
      visible: false,
      exec: () => {
        UpdateConfig.setCaretStyle("carrot");
      },
    },
  ],
};

let commandsPaceCaretStyle = {
  title: "Change pace caret style...",
  list: [
    {
      id: "setPaceCaretStyleOff",
      display: "off",
      exec: () => {
        UpdateConfig.setPaceCaretStyle("off");
      },
    },
    {
      id: "setPaceCaretStyleDefault",
      display: "line",
      exec: () => {
        UpdateConfig.setPaceCaretStyle("default");
      },
    },
    {
      id: "setPaceCaretStyleBlock",
      display: "block",
      exec: () => {
        UpdateConfig.setPaceCaretStyle("block");
      },
    },
    {
      id: "setPaceCaretStyleOutline",
      display: "outline-block",
      exec: () => {
        UpdateConfig.setPaceCaretStyle("outline");
      },
    },
    {
      id: "setPaceCaretStyleUnderline",
      display: "underline",
      exec: () => {
        UpdateConfig.setPaceCaretStyle("underline");
      },
    },
  ],
};

let commandsPaceCaret = {
  title: "Change pace caret mode...",
  list: [
    {
      id: "setPaceCaretOff",
      display: "off",
      exec: () => {
        UpdateConfig.setPaceCaret("off");
      },
    },
    {
      id: "setPaceCaretPb",
      display: "pb",
      exec: () => {
        UpdateConfig.setPaceCaret("pb");
      },
    },
    {
      id: "setPaceCaretAverage",
      display: "average",
      exec: () => {
        UpdateConfig.setPaceCaret("average");
      },
    },
    {
      id: "setPaceCaretCustom",
      display: "custom...",
      input: true,
      exec: (input) => {
        UpdateConfig.setPaceCaretCustomSpeed(input);
        UpdateConfig.setPaceCaret("custom");
      },
    },
  ],
};

let commandsMinWpm = {
  title: "Change min wpm mode...",
  list: [
    {
      id: "setMinWpmOff",
      display: "off",
      exec: () => {
        UpdateConfig.setMinWpm("off");
      },
    },
    {
      id: "setMinWpmCustom",
      display: "custom...",
      input: true,
      exec: (input) => {
        UpdateConfig.setMinWpmCustomSpeed(input);
        UpdateConfig.setMinWpm("custom");
      },
    },
  ],
};

let commandsMinAcc = {
  title: "Change min accuracy mode...",
  list: [
    {
      id: "setMinAccOff",
      display: "off",
      exec: () => {
        UpdateConfig.setMinAcc("off");
      },
    },
    {
      id: "setMinAccCustom",
      display: "custom...",
      input: true,
      exec: (input) => {
        UpdateConfig.setMinAccCustom(input);
        UpdateConfig.setMinAcc("custom");
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
        UpdateConfig.setKeymapStyle("staggered");
      },
    },
    {
      id: "setKeymapStyleMatrix",
      display: "matrix",
      exec: () => {
        UpdateConfig.setKeymapStyle("matrix");
      },
    },
    {
      id: "setKeymapStyleSplit",
      display: "split",
      exec: () => {
        UpdateConfig.setKeymapStyle("split");
      },
    },
    {
      id: "setKeymapStyleSplitMatrix",
      display: "split matrix",
      exec: () => {
        UpdateConfig.setKeymapStyle("split_matrix");
      },
    },
  ],
};

let commandsHighlightMode = {
  title: "Change highlight mode...",
  list: [
    {
      id: "setHighlightModeLetter",
      display: "letter",
      exec: () => {
        UpdateConfig.setHighlightMode("letter");
      },
    },
    {
      id: "setHighlightModeWord",
      display: "word",
      exec: () => {
        UpdateConfig.setHighlightMode("word");
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
        UpdateConfig.setTimerStyle("bar");
      },
    },
    {
      id: "setTimerStyleText",
      display: "text",
      exec: () => {
        UpdateConfig.setTimerStyle("text");
      },
    },
    {
      id: "setTimerStyleMini",
      display: "mini",
      exec: () => {
        UpdateConfig.setTimerStyle("mini");
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
        UpdateConfig.setTimerColor("bar");
      },
    },
    {
      id: "setTimerColorSub",
      display: "sub",
      exec: () => {
        UpdateConfig.setTimerColor("sub");
      },
    },
    {
      id: "setTimerColorText",
      display: "text",
      exec: () => {
        UpdateConfig.setTimerColor("text");
      },
    },
    {
      id: "setTimerColorMain",
      display: "main",
      exec: () => {
        UpdateConfig.setTimerColor("main");
      },
    },
  ],
};

let commandsSingleListCommandLine = {
  title: "Single list command line...",
  list: [
    {
      id: "singleListCommandLineManual",
      display: "manual",
      exec: () => {
        UpdateConfig.setSingleListCommandLine("manual");
      },
    },
    {
      id: "singleListCommandLineOn",
      display: "on",
      exec: () => {
        UpdateConfig.setSingleListCommandLine("on");
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
        UpdateConfig.setTimerOpacity(0.25);
      },
    },
    {
      id: "setTimerOpacity.5",
      display: ".5",
      exec: () => {
        UpdateConfig.setTimerOpacity(0.5);
      },
    },
    {
      id: "setTimerOpacity.75",
      display: ".75",
      exec: () => {
        UpdateConfig.setTimerOpacity(0.75);
      },
    },
    {
      id: "setTimerOpacity1",
      display: "1",
      exec: () => {
        UpdateConfig.setTimerOpacity(1);
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
        UpdateConfig.setWordCount("10");
        TestLogic.restart();
      },
    },
    {
      id: "changeWordCount25",
      display: "25",
      exec: () => {
        UpdateConfig.setWordCount("25");
        TestLogic.restart();
      },
    },
    {
      id: "changeWordCount50",
      display: "50",
      exec: () => {
        UpdateConfig.setWordCount("50");
        TestLogic.restart();
      },
    },
    {
      id: "changeWordCount100",
      display: "100",
      exec: () => {
        UpdateConfig.setWordCount("100");
        TestLogic.restart();
      },
    },
    {
      id: "changeWordCount200",
      display: "200",
      exec: () => {
        UpdateConfig.setWordCount("200");
        TestLogic.restart();
      },
    },
    {
      id: "changeWordCountCustom",
      display: "custom...",
      input: true,
      exec: (input) => {
        UpdateConfig.setWordCount(input);
        TestLogic.restart();
      },
    },
  ],
};

let commandsQuoteLengthConfig = {
  title: "Change quote length...",
  list: [
    {
      id: "changeQuoteLengthAll",
      display: "all",
      exec: () => {
        UpdateConfig.setQuoteLength(-1);
        TestLogic.restart();
      },
    },
    {
      id: "changeQuoteLengthShort",
      display: "short",
      exec: () => {
        UpdateConfig.setQuoteLength(0);
        TestLogic.restart();
      },
    },
    {
      id: "changeQuoteLengthMedium",
      display: "medium",
      exec: () => {
        UpdateConfig.setQuoteLength(1);
        TestLogic.restart();
      },
    },
    {
      id: "changeQuoteLengthLong",
      display: "long",
      exec: () => {
        UpdateConfig.setQuoteLength(2);
        TestLogic.restart();
      },
    },
    {
      id: "changeQuoteLengthThicc",
      display: "thicc",
      exec: () => {
        UpdateConfig.setQuoteLength(3);
        TestLogic.restart();
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
        UpdateConfig.setMode("time");
        TestLogic.restart();
      },
    },
    {
      id: "changeModeWords",
      display: "words",
      exec: () => {
        UpdateConfig.setMode("words");
        TestLogic.restart();
      },
    },
    {
      id: "changeModeQuote",
      display: "quote",
      exec: () => {
        UpdateConfig.setMode("quote");
        TestLogic.restart();
      },
    },
    {
      id: "changeModeCustom",
      display: "custom",
      exec: () => {
        UpdateConfig.setMode("custom");
        TestLogic.restart();
      },
    },
    {
      id: "changeModeZen",
      display: "zen",
      exec: () => {
        UpdateConfig.setMode("zen");
        ManualRestart.set();
        TestLogic.restart();
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
        UpdateConfig.setTimeConfig("15");
        TestLogic.restart();
      },
    },
    {
      id: "changeTimeConfig30",
      display: "30",
      exec: () => {
        UpdateConfig.setTimeConfig("30");
        TestLogic.restart();
      },
    },
    {
      id: "changeTimeConfig60",
      display: "60",
      exec: () => {
        UpdateConfig.setTimeConfig("60");
        TestLogic.restart();
      },
    },
    {
      id: "changeTimeConfig120",
      display: "120",
      exec: () => {
        UpdateConfig.setTimeConfig("120");
        TestLogic.restart();
      },
    },
    {
      id: "changeTimeConfigCustom",
      display: "custom...",
      input: true,
      exec: (input) => {
        UpdateConfig.setTimeConfig(input);
        TestLogic.restart();
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
        UpdateConfig.setConfidenceMode("off");
      },
    },
    {
      id: "changeConfidenceModeOn",
      display: "on",
      exec: () => {
        UpdateConfig.setConfidenceMode("on");
      },
    },
    {
      id: "changeConfidenceModeMax",
      display: "max",
      exec: () => {
        UpdateConfig.setConfidenceMode("max");
      },
    },
  ],
};

let commandsStopOnError = {
  title: "Change stop on error...",
  list: [
    {
      id: "changeStopOnErrorOff",
      display: "off",
      exec: () => {
        UpdateConfig.setStopOnError("off");
      },
    },
    {
      id: "changeStopOnErrorLetter",
      display: "letter",
      exec: () => {
        UpdateConfig.setStopOnError("letter");
      },
    },
    {
      id: "changeStopOnErrorWord",
      display: "word",
      exec: () => {
        UpdateConfig.setStopOnError("word");
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
        UpdateConfig.setFontSize(1);
        TestLogic.restart();
      },
    },
    {
      id: "changeFontSize125",
      display: "1.25x",
      exec: () => {
        UpdateConfig.setFontSize(125);
        TestLogic.restart();
      },
    },
    {
      id: "changeFontSize15",
      display: "1.5x",
      exec: () => {
        UpdateConfig.setFontSize(15);
        TestLogic.restart();
      },
    },
    {
      id: "changeFontSize2",
      display: "2x",
      exec: () => {
        UpdateConfig.setFontSize(2);
        TestLogic.restart();
      },
    },
    {
      id: "changeFontSize3",
      display: "3x",
      exec: () => {
        UpdateConfig.setFontSize(3);
        TestLogic.restart();
      },
    },
  ],
};

let commandsTags = {
  title: "Change tags...",
  list: [],
};

function updateCommandsTagsList() {
  if (DB.getSnapshot().tags.length > 0) {
    commandsTags.list = [];

    commandsTags.list.push({
      id: "clearTags",
      display: "Clear tags",
      exec: () => {
        DB.getSnapshot().tags.forEach((tag) => {
          tag.active = false;
        });
        TestUI.updateModesNotice();
        TagController.saveActiveToCookie();
      },
    });

    DB.getSnapshot().tags.forEach((tag) => {
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
          TagController.toggle(tag.id);
          TestUI.updateModesNotice();
          let txt = tag.name;

          if (tag.active === true) {
            txt = '<i class="fas fa-check-square"></i>' + txt;
          } else {
            txt = '<i class="fas fa-square"></i>' + txt;
          }
          if (isSingleListCommandLineActive()) {
            $(
              `#commandLine .suggestions .entry[command='toggleTag${tag.id}']`
            ).html("Change tags > " + txt);
          } else {
            $(
              `#commandLine .suggestions .entry[command='toggleTag${tag.id}']`
            ).html(txt);
          }
        },
      });
    });
    commands.list[4].visible = true;
  }
}

let commandsThemes = {
  title: "Change theme...",
  list: [],
};

Misc.getThemesList().then((themes) => {
  themes.forEach((theme) => {
    commandsThemes.list.push({
      id: "changeTheme" + Misc.capitalizeFirstLetter(theme.name),
      display: theme.name.replace(/_/g, " "),
      hover: () => {
        // previewTheme(theme.name);
        ThemeController.preview(theme.name);
      },
      exec: () => {
        UpdateConfig.setTheme(theme.name);
      },
    });
  });
});

let commands = {
  title: "",
  list: [
    {
      id: "togglePunctuation",
      display: "Toggle punctuation",
      exec: () => {
        UpdateConfig.togglePunctuation();
        TestLogic.restart();
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
      alias: "words",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsWordCount);
        showCommandLine();
      },
    },
    {
      id: "changeQuoteLength",
      display: "Change quote length...",
      alias: "quotes",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsQuoteLengthConfig);
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
      id: "changeStopOnError",
      display: "Change stop on error...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsStopOnError);
        showCommandLine();
      },
    },
    {
      id: "changeSoundOnClick",
      display: "Change sound on click...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsSoundOnClick);
        showCommandLine();
      },
    },
    {
      id: "toggleNumbers",
      display: "Toggle numbers",
      exec: () => {
        UpdateConfig.toggleNumbers();
        TestLogic.restart();
      },
    },
    {
      id: "toggleSmoothCaret",
      display: "Toggle smooth caret",
      exec: () => {
        UpdateConfig.toggleSmoothCaret();
      },
    },
    {
      id: "toggleQuickTab",
      display: "Toggle quick tab mode",
      exec: () => {
        console.log("before command");
        console.log(Config.quickTab);
        UpdateConfig.toggleQuickTabMode();
        console.log("after command");
        console.log(Config.quickTab);
      },
    },
    {
      id: "changeRepeatQuotes",
      display: "Change repeat quotes...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsRepeatQuotes);
        showCommandLine();
      },
    },
    {
      id: "toggleShowLiveWpm",
      display: "Toggle live wpm display",
      exec: () => {
        UpdateConfig.toggleShowLiveWpm();
      },
    },
    {
      id: "toggleShowLiveAcc",
      display: "Toggle live accuracy display",
      exec: () => {
        UpdateConfig.toggleLiveAcc();
      },
    },
    {
      id: "toggleTimerBar",
      display: "Toggle timer display",
      exec: () => {
        UpdateConfig.toggleShowTimerProgress();
      },
    },
    {
      id: "toggleKeyTips",
      display: "Toggle keybind tips",
      exec: () => {
        UpdateConfig.toggleKeyTips();
      },
    },
    {
      id: "toggleFreedom",
      display: "Toggle freedom mode",
      exec: () => {
        UpdateConfig.toggleFreedomMode();
      },
    },
    {
      id: "toggleStrictSpace",
      display: "Toggle strict space",
      exec: () => {
        UpdateConfig.toggleStrictSpace();
      },
    },
    {
      id: "toggleBlindMode",
      display: "Toggle blind mode",
      exec: () => {
        UpdateConfig.toggleBlindMode();
      },
    },
    {
      id: "toggleAlwaysShowWordsHistory",
      display: "Toggle always show words history",
      exec: () => {
        UpdateConfig.toggleAlwaysShowWordsHistory();
      },
    },
    {
      id: "toggleIndicateTypos",
      display: "Toggle indicate typos",
      exec: () => {
        UpdateConfig.toggleIndicateTypos();
      },
    },
    {
      id: "toggleHideExtraLetters",
      display: "Toggle hide extra letters",
      exec: () => {
        UpdateConfig.toggleHideExtraLetters();
      },
    },
    {
      id: "toggleQuickEnd",
      display: "Toggle quick end",
      exec: () => {
        UpdateConfig.toggleQuickEnd();
      },
    },
    {
      id: "singleListCommandLine",
      display: "Single list command line...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsSingleListCommandLine);
        showCommandLine();
      },
    },
    {
      id: "changeMinWpm",
      display: "Change min wpm mode...",
      alias: "minimum",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsMinWpm);
        showCommandLine();
      },
    },
    {
      id: "changeMinAcc",
      display: "Change min accuracy mode...",
      alias: "minimum",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsMinAcc);
        showCommandLine();
      },
    },
    {
      id: "changeOppositeShiftMode",
      display: "Change opposite shift mode...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsOppositeShiftMode);
        showCommandLine();
      },
    },
    {
      id: "togglePlaySoundOnError",
      display: "Toggle play sound on error",
      exec: () => {
        UpdateConfig.togglePlaySoundOnError();
      },
    },
    {
      id: "toggleFlipTestColors",
      display: "Toggle flip test colors",
      exec: () => {
        UpdateConfig.toggleFlipTestColors();
      },
    },
    {
      id: "toggleSmoothLineScroll",
      display: "Toggle smooth line scroll",
      exec: () => {
        UpdateConfig.toggleSmoothLineScroll();
      },
    },
    {
      id: "toggleAlwaysShowDecimalPlaces",
      display: "Toggle always show decimal places",
      exec: () => {
        UpdateConfig.toggleAlwaysShowDecimalPlaces();
      },
    },
    {
      id: "toggleAlwaysShowCPM",
      display: "Toggle always show CPM",
      exec: () => {
        UpdateConfig.toggleAlwaysShowCPM();
      },
    },
    {
      id: "toggleStartGraphsAtZero",
      display: "Toggle start graphs at zero",
      exec: () => {
        UpdateConfig.toggleStartGraphsAtZero();
      },
    },
    {
      id: "toggleSwapEscAndTab",
      display: "Toggle swap esc and tab",
      exec: () => {
        UpdateConfig.toggleSwapEscAndTab();
      },
    },
    {
      id: "toggleShowAllLines",
      display: "Toggle show all lines",
      exec: () => {
        UpdateConfig.toggleShowAllLines();
      },
    },
    {
      id: "toggleColorfulMode",
      display: "Toggle colorful mode",
      exec: () => {
        UpdateConfig.toggleColorfulMode();
      },
    },
    {
      id: "toggleShowOutOfFocusWarning",
      display: "Toggle out of focus warning",
      exec: () => {
        UpdateConfig.toggleShowOutOfFocusWarning();
      },
    },
    {
      id: "setEnableAds",
      display: "Set enable ads...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsEnableAds);
        showCommandLine();
      },
    },
    {
      id: "toggleCustomTheme",
      display: "Toggle preset/custom theme",
      exec: () => {
        UpdateConfig.toggleCustomTheme();
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
      id: "changePaceCaret",
      display: "Change pace caret mode...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsPaceCaret);
        showCommandLine();
      },
    },
    {
      id: "changePaceCaretStyle",
      display: "Change pace caret style...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsPaceCaretStyle);
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
      id: "changeHighlightMode",
      display: "Change highlight mode...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsHighlightMode);
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
      id: "changeRandomTheme",
      display: "Change random theme...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsRandomTheme);
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
      alias: "fun box",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsFunbox);
        showCommandLine();
      },
    },
    {
      id: "toggleCapsLockBackspace",
      display: "Toggle caps lock backspace",
      exec: () => {
        UpdateConfig.toggleCapsLockBackspace();
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
      alias: "keyboard",
      exec: () => {
        currentCommands.push(commandsKeymapMode);
        showCommandLine();
      },
    },
    {
      id: "changeKeymapStyle",
      display: "Change keymap style...",
      alias: "keyboard",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsKeymapStyle);
        showCommandLine();
      },
    },
    {
      id: "changeKeymapLayout",
      display: "Change keymap layout...",
      alias: "keyboard",
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
      id: "changePageWidth",
      display: "Change page width...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsPageWidth);
        showCommandLine();
      },
    },
    {
      id: "randomiseTheme",
      display: "Next random theme",
      exec: () => ThemeController.randomiseTheme(),
    },
    {
      id: "viewTypingPage",
      display: "View Typing Page",
      alias: "start begin type test",
      exec: () => $("#top #menu .icon-button.view-start").click(),
    },
    {
      id: "viewLeaderboards",
      display: "View Leaderboards Page",
      exec: () => $("#top #menu .icon-button.view-leaderboards").click(),
    },
    {
      id: "viewAbout",
      display: "View About Page",
      exec: () => $("#top #menu .icon-button.view-about").click(),
    },
    {
      id: "viewSettings",
      display: "View Settings Page",
      exec: () => $("#top #menu .icon-button.view-settings").click(),
    },
    {
      id: "viewAccount",
      display: "View Account Page",
      alias: "stats",
      exec: () =>
        $("#top #menu .icon-button.view-account").hasClass("hidden")
          ? $("#top #menu .icon-button.view-login").click()
          : $("#top #menu .icon-button.view-account").click(),
    },
    {
      id: "toggleFullscreen",
      display: "Toggle Fullscreen",
      exec: () => {
        Misc.toggleFullscreen();
      },
    },
    {
      id: "bailOut",
      display: "Bail out...",
      subgroup: true,
      visible: false,
      exec: () => {
        currentCommands.push({
          title: "Are you sure...",
          list: [
            {
              id: "bailOutNo",
              display: "Nevermind",
              exec: () => {
                hideCommandLine();
              },
              available: () => {
                return canBailOut();
              },
            },
            {
              id: "bailOutForSure",
              display: "Yes, I am sure",
              exec: () => {
                TestLogic.setBailout(true);
                TestLogic.finish();
              },
              available: () => {
                return canBailOut();
              },
            },
          ],
        });
        showCommandLine();
      },
      available: () => {
        return canBailOut();
      },
    },
    {
      id: "joinDiscord",
      display: "Join the Discord server",
      exec: () => {
        window.open("https://discord.gg/monkeytype");
      },
    },
    {
      id: "repeatTest",
      display: "Repeat test",
      exec: () => {
        TestLogic.restart(true);
      },
      available: () => {
        return TestUI.resultVisible;
      },
    },
    {
      id: "practiceMissedWords",
      display: "Practice missed words",
      exec: () => {
        PractiseMissed.init();
      },
      available: () => {
        return (
          TestUI.resultVisible && Object.keys(TestStats.missedWords).length > 0
        );
      },
    },
    {
      id: "toggleWordHistory",
      display: "Toggle word history",
      exec: () => {
        TestUI.toggleResultWords();
      },
      available: () => {
        return TestUI.resultVisible;
      },
    },
    {
      id: "saveScreenshot",
      display: "Save screenshot",
      alias: "ss picture",
      exec: () => {
        setTimeout(() => {
          TestUI.screenshot();
        }, 500);
      },
      available: () => {
        return TestUI.resultVisible;
      },
    },
    {
      id: "changeCustomModeText",
      display: "Change custom text",
      exec: () => {
        CustomTextPopup.show();
      },
    },
    {
      id: "toggleMonkey",
      display: "Toggle Monkey",
      visible: false,
      exec: () => {
        UpdateConfig.toggleMonkey();
      },
    },
  ],
};

function showFavouriteThemesAtTheTop() {
  if (Config.favThemes.length > 0) {
    commandsThemes.list = [];
    UpdateConfig.favThemes.forEach((theme) => {
      commandsThemes.list.push({
        id: "changeTheme" + Misc.capitalizeFirstLetter(theme),
        display: theme.replace(/_/g, " "),
        hover: () => {
          // previewTheme(theme);
          ThemeController.preview(theme);
        },
        exec: () => {
          UpdateConfig.setTheme(theme);
        },
      });
    });
    Misc.getThemesList().then((themes) => {
      themes.forEach((theme) => {
        if (Config.favThemes.includes(theme.name)) return;
        commandsThemes.list.push({
          id: "changeTheme" + Misc.capitalizeFirstLetter(theme.name),
          display: theme.name.replace(/_/g, " "),
          hover: () => {
            // previewTheme(theme.name);
            ThemeController.preview(theme.name);
          },
          exec: () => {
            UpdateConfig.setTheme(theme.name);
          },
        });
      });
    });
  }
}

let commandsFonts = {
  title: "Change font...",
  list: [],
};

function canBailOut() {
  return (
    (Config.mode === "custom" &&
      CustomText.isWordRandom &&
      CustomText.word >= 5000) ||
    (Config.mode === "custom" &&
      !CustomText.isWordRandom &&
      !CustomText.isTimeRandom &&
      CustomText.text.length >= 5000) ||
    (Config.mode === "custom" &&
      CustomText.isTimeRandom &&
      CustomText.time >= 3600) ||
    (Config.mode === "words" && Config.words >= 5000) ||
    Config.words === 0 ||
    (Config.mode === "time" && (Config.time >= 3600 || Config.time === 0)) ||
    Config.mode == "zen"
  );
}

function addChildCommands(
  unifiedCommands,
  commandItem,
  parentCommandDisplay = ""
) {
  let commandItemDisplay = commandItem.display.replace(/\s?\.\.\.$/g, "");
  if (parentCommandDisplay)
    commandItemDisplay = parentCommandDisplay + " > " + commandItemDisplay;
  if (commandItem.subgroup) {
    try {
      commandItem.exec();
      const currentCommandsIndex = currentCommands.length - 1;
      currentCommands[currentCommandsIndex].list.forEach((cmd) => {
        if (cmd.alias === undefined) cmd.alias = commandItem.alias;
        addChildCommands(unifiedCommands, cmd, commandItemDisplay);
      });
      currentCommands.pop();
    } catch (e) {}
  } else {
    let tempCommandItem = { ...commandItem };
    if (parentCommandDisplay) tempCommandItem.display = commandItemDisplay;
    unifiedCommands.push(tempCommandItem);
  }
}

function generateSingleListOfCommands() {
  const allCommands = [];
  const oldShowCommandLine = showCommandLine;
  showCommandLine = () => {};
  commands.list.forEach((c) => addChildCommands(allCommands, c));
  showCommandLine = oldShowCommandLine;
  return {
    title: "All Commands",
    list: allCommands,
  };
}

function isSingleListCommandLineActive() {
  return $("#commandLine").hasClass("allCommands");
}

function useSingleListCommandLine(show = true) {
  let allCommands = generateSingleListOfCommands();
  if (Config.singleListCommandLine == "manual")
    currentCommands.push(allCommands);
  else if (Config.singleListCommandLine == "on")
    currentCommands = [allCommands];

  if (Config.singleListCommandLine != "off")
    $("#commandLine").addClass("allCommands");
  if (show) showCommandLine();
}

function restoreOldCommandLine(show = true) {
  if (isSingleListCommandLineActive()) {
    $("#commandLine").removeClass("allCommands");
    currentCommands = currentCommands.filter((l) => l.title != "All Commands");
    if (currentCommands.length < 1) currentCommands = [commands];
  }
  if (show) showCommandLine();
}

Misc.getFontsList().then((fonts) => {
  fonts.forEach((font) => {
    commandsFonts.list.push({
      id: "changeFont" + font.name.replace(/ /g, "_"),
      display: font.display !== undefined ? font.display : font.name,
      hover: () => {
        UpdateConfig.previewFontFamily(font.name);
      },
      exec: () => {
        UpdateConfig.setFontFamily(font.name.replace(/ /g, "_"));
      },
    });
  });
  commandsFonts.list.push({
    id: "setFontFamilyCustom",
    display: "custom...",
    input: true,
    hover: () => {
      UpdateConfig.previewFontFamily(Config.fontFamily);
    },
    exec: (name) => {
      UpdateConfig.setFontFamily(name.replace(/\s/g, "_"));
      settingsGroups.fontFamily.updateButton();
    },
  });
});

let commandsFunbox = {
  title: "Change funbox...",
  list: [
    {
      id: "changeFunboxNone",
      display: "none",
      exec: () => {
        if (Funbox.activate("none", null)) {
          TestLogic.restart();
        }
      },
    },
  ],
};

Misc.getFunboxList().then((funboxes) => {
  funboxes.forEach((funbox) => {
    commandsFunbox.list.push({
      id: "changeFunbox" + funbox.name,
      display: funbox.name.replace(/_/g, " "),
      exec: () => {
        if (Funbox.activate(funbox.name, funbox.type)) {
          TestLogic.restart();
        }
      },
    });
  });
});

let commandsLanguages = {
  title: "Change language...",
  list: [
    {
      id: "couldnotload",
      display: "Could not load the languages list :(",
    },
  ],
};

commandsLanguages.list = [];
Misc.getLanguageList().then((languages) => {
  languages.forEach((language) => {
    commandsLanguages.list.push({
      id: "changeLanguage" + Misc.capitalizeFirstLetter(language),
      display: language.replace(/_/g, " "),
      exec: () => {
        UpdateConfig.setLanguage(language);
        TestLogic.restart();
      },
    });
  });
});

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
      id: "changeLayout" + Misc.capitalizeFirstLetter(layout),
      display: layout.replace(/_/g, " "),
      exec: () => {
        UpdateConfig.setSavedLayout(layout);
        TestLogic.restart();
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
  commandsKeymapLayouts.list.push({
    id: "changeKeymapLayoutOverrideSync",
    display: "override sync",
    exec: () => {
      UpdateConfig.setKeymapLayout("overrideSync");
      TestLogic.restart();
    },
  });
  Object.keys(layouts).forEach((layout) => {
    if (layout.toString() != "default") {
      commandsKeymapLayouts.list.push({
        id: "changeKeymapLayout" + Misc.capitalizeFirstLetter(layout),
        display: layout.replace(/_/g, " "),
        exec: () => {
          UpdateConfig.setKeymapLayout(layout);
          TestLogic.restart();
        },
      });
    }
  });
}

$("#commandLine input").keyup((e) => {
  commandLineMouseMode = false;
  $("#commandLineWrapper #commandLine .suggestions .entry").removeClass(
    "activeMouse"
  );
  if (
    e.keyCode == 38 ||
    e.keyCode == 40 ||
    e.keyCode == 13 ||
    e.code == "Tab" ||
    e.code == "AltLeft" ||
    (e.altKey && (e.keyCode == 74 || e.keyCode == 75))
  )
    return;
  updateSuggestedCommands();
});

$(document).ready((e) => {
  $(document).keydown((event) => {
    //escape
    if (event.keyCode == 27 || (event.keyCode == 9 && Config.swapEscAndTab)) {
      event.preventDefault();
      if (!$("#leaderboardsWrapper").hasClass("hidden")) {
        //maybe add more condition for closing other dialogs in the future as well
        event.preventDefault();
        Leaderboards.hide();
      } else if (!$("#commandLineWrapper").hasClass("hidden")) {
        if (currentCommands.length > 1) {
          currentCommands.pop();
          $("#commandLine").removeClass("allCommands");
          showCommandLine();
        } else {
          hideCommandLine();
        }
        UpdateConfig.setFontFamily(Config.fontFamily, true);
      } else if (event.keyCode == 9 || !Config.swapEscAndTab) {
        if (Config.singleListCommandLine == "on")
          useSingleListCommandLine(false);
        else currentCommands = [commands];
        showCommandLine();
      }
    }
  });
});

$("#commandInput input").keydown((e) => {
  if (e.keyCode == 13) {
    //enter
    e.preventDefault();
    let command = $("#commandInput input").attr("command");
    let value = $("#commandInput input").val();
    let list = currentCommands[currentCommands.length - 1];
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
    hideCommandLine();
  }
  return;
});

let commandLineMouseMode = false;

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
  console.log("clearing keyboard active");
  $("#commandLineWrapper #commandLine .suggestions .entry").removeClass(
    "activeKeyboard"
  );
  let hoverId = $(e.target).attr("command");
  try {
    let list = currentCommands[currentCommands.length - 1];
    $.each(list.list, (index, obj) => {
      if (obj.id == hoverId) {
        if (!/theme/gi.test(obj.id) || obj.id === "toggleCustomTheme")
          ThemeController.clearPreview();
        if (!/font/gi.test(obj.id)) Config.previewFontFamily(Config.fontFamily);
        obj.hover();
      }
    });
  } catch (e) {}
});

$("#commandLineWrapper #commandLine .suggestions").click((e) => {
  $(".suggestions .entry").removeClass("activeKeyboard");
  triggerCommand($(e.target).attr("command"));
});

$("#commandLineWrapper").click((e) => {
  if ($(e.target).attr("id") === "commandLineWrapper") {
    hideCommandLine();
    UpdateConfig.setFontFamily(Config.fontFamily, true);
    // if (Config.customTheme === true) {
    //   applyCustomThemeColors();
    // } else {
    //   setTheme(Config.theme, true);
    // }
  }
});

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
        useSingleListCommandLine();
        return;
      } else if ($("#commandLine input").val() == ">") {
        //so that it will ignore succeeding ">" when input is already ">"
        e.preventDefault();
        return;
      }
    }
    if (
      e.keyCode == 8 &&
      $("#commandLine input").val().length == 1 &&
      Config.singleListCommandLine == "manual" &&
      isSingleListCommandLineActive()
    )
      restoreOldCommandLine();
    if (e.keyCode == 13) {
      //enter
      e.preventDefault();
      let command = $(".suggestions .entry.activeKeyboard").attr("command");
      triggerCommand(command);
      return;
    }
    if (
      e.keyCode == 38 ||
      e.keyCode == 40 ||
      e.code == "Tab" ||
      (e.altKey && (e.keyCode == 74 || e.keyCode == 75))
    ) {
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
      if (
        e.keyCode == 38 ||
        (e.code == "Tab" && e.shiftKey) ||
        (e.altKey && e.keyCode == 75)
      ) {
        entries.removeClass("activeKeyboard");
        if (activenum == 0) {
          $(entries[entries.length - 1]).addClass("activeKeyboard");
          hoverId = $(entries[entries.length - 1]).attr("command");
        } else {
          $(entries[--activenum]).addClass("activeKeyboard");
          hoverId = $(entries[activenum]).attr("command");
        }
      }
      if (
        e.keyCode == 40 ||
        (e.code == "Tab" && !e.shiftKey) ||
        (e.altKey && e.keyCode == 74)
      ) {
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
        let list = currentCommands[currentCommands.length - 1];
        $.each(list.list, (index, obj) => {
          if (obj.id == hoverId) {
            if (!/theme/gi.test(obj.id) || obj.id === "toggleCustomTheme")
              ThemeController.clearPreview();
            if (!/font/gi.test(obj.id))
              Config.previewFontFamily(Config.fontFamily);
            obj.hover();
          }
        });
      } catch (e) {}

      return false;
    }
  }
});

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
  UpdateConfig.previewFontFamily(Config.fontFamily);
  // applyCustomThemeColors();
  ThemeController.clearPreview();
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
        focusWords();
      }
    );
  focusWords();
}

function showCommandInput(command, placeholder) {
  $("#commandLineWrapper").removeClass("hidden");
  $("#commandLine").addClass("hidden");
  $("#commandInput").removeClass("hidden");
  $("#commandInput input").attr("placeholder", placeholder);
  $("#commandInput input").val("");
  $("#commandInput input").focus();
  $("#commandInput input").attr("command", "");
  $("#commandInput input").attr("command", command);
}

function updateSuggestedCommands() {
  let inputVal = $("#commandLine input")
    .val()
    .toLowerCase()
    .split(" ")
    .filter((s, i) => s || i == 0); //remove empty entries after first
  let list = currentCommands[currentCommands.length - 1];
  if (
    inputVal[0] === "" &&
    Config.singleListCommandLine === "on" &&
    currentCommands.length === 1
  ) {
    $.each(list.list, (index, obj) => {
      obj.found = false;
    });
    displayFoundCommands();
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
        let res2 = null;
        if (obj.alias !== undefined) {
          res2 = obj.alias.toLowerCase().match(re);
        }
        if (
          (res != null && res.length > 0) ||
          (res2 != null && res2.length > 0)
        ) {
          foundcount++;
        } else {
          foundcount--;
        }
      });
      if (foundcount > 0) {
        obj.found = true;
      } else {
        obj.found = false;
      }
    });
  }
  displayFoundCommands();
}

function displayFoundCommands() {
  $("#commandLine .suggestions").empty();
  let commandsHTML = "";
  let list = currentCommands[currentCommands.length - 1];
  $.each(list.list, (index, obj) => {
    if (obj.found && (obj.available !== undefined ? obj.available() : true)) {
      commandsHTML +=
        '<div class="entry" command="' + obj.id + '">' + obj.display + "</div>";
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
          if (!/theme/gi.test(obj.id) || obj.id === "toggleCustomTheme")
            ThemeController.clearPreview();
          if (!/font/gi.test(obj.id))
            Config.previewFontFamily(Config.fontFamily);
          obj.hover();
          return false;
        }
      });
    } catch (e) {}
  }
  $("#commandLine .listTitle").remove();
}
