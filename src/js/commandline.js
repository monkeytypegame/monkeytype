function canBailOut() {
  return (
    (config.mode === "custom" &&
      customText.isWordRandom &&
      customText.word >= 5000) ||
    (config.mode === "custom" &&
      !customText.isWordRandom &&
      !customText.isTimeRandom &&
      customText.text.length >= 5000) ||
    (config.mode === "custom" &&
      customText.isTimeRandom &&
      customText.time >= 3600) ||
    (config.mode === "words" && config.words >= 5000) ||
    config.words === 0 ||
    (config.mode === "time" && (config.time >= 3600 || config.time === 0)) ||
    config.mode == "zen"
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
      currentCommands[currentCommandsIndex].list.forEach((cmd) =>
        addChildCommands(unifiedCommands, cmd, commandItemDisplay)
      );
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
  if (config.singleListCommandLine == "manual")
    currentCommands.push(allCommands);
  else if (config.singleListCommandLine == "on")
    currentCommands = [allCommands];

  if (config.singleListCommandLine != "off")
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
      id: "changeQuoteLength",
      display: "Change quote length...",
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
        toggleNumbers();
        restartTest();
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
        toggleShowLiveWpm();
        saveConfigToCookie();
      },
    },
    {
      id: "toggleShowLiveAcc",
      display: "Toggle live accuracy display",
      exec: () => {
        toggleShowLiveAcc();
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
      id: "toggleStrictSpace",
      display: "Toggle strict space",
      exec: () => {
        toggleStrictSpace();
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
      id: "toggleAlwaysShowWordsHistory",
      display: "Toggle always show words history",
      exec: () => {
        toggleAlwaysShowWordsHistory();
      },
    },
    {
      id: "toggleIndicateTypos",
      display: "Toggle indicate typos",
      exec: () => {
        toggleIndicateTypos();
      },
    },
    {
      id: "toggleHideExtraLetters",
      display: "Toggle hide extra letters",
      exec: () => {
        toggleHideExtraLetters();
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
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsMinWpm);
        showCommandLine();
      },
    },
    {
      id: "changeMinAcc",
      display: "Change min accuracy mode...",
      subgroup: true,
      exec: () => {
        currentCommands.push(commandsMinAcc);
        showCommandLine();
      },
    },
    {
      id: "togglePlaySoundOnError",
      display: "Toggle play sound on error",
      exec: () => {
        togglePlaySoundOnError();
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
      id: "toggleAlwaysShowCPM",
      display: "Toggle always show CPM",
      exec: () => {
        toggleAlwaysShowCPM();
      },
    },
    {
      id: "toggleStartGraphsAtZero",
      display: "Toggle start graphs at zero",
      exec: () => {
        toggleStartGraphsAtZero();
      },
    },
    {
      id: "toggleSwapEscAndTab",
      display: "Toggle swap esc and tab",
      exec: () => {
        toggleSwapEscAndTab();
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
      id: "toggleShowOutOfFocusWarning",
      display: "Toggle out of focus warning",
      exec: () => {
        toggleShowOutOfFocusWarning();
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
        toggleCapsLockBackspace();
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
      exec: () => randomiseTheme(),
    },
    {
      id: "viewTypingPage",
      display: "View Typing Page",
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
                bailout = true;
                showResult();
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
        restartTest(true);
      },
      available: () => {
        return resultVisible;
      },
    },
    {
      id: "practiceMissedWords",
      display: "Practice missed words",
      exec: () => {
        initPractiseMissedWords();
      },
      available: () => {
        return resultVisible && Object.keys(missedWords).length > 0;
      },
    },
    {
      id: "toggleWordHistory",
      display: "Toggle word history",
      exec: () => {
        toggleResultWordsDisplay();
      },
      available: () => {
        return resultVisible;
      },
    },
    {
      id: "saveScreenshot",
      display: "Save screenshot",
      exec: () => {
        copyResultToClipboard();
      },
      available: () => {
        return resultVisible;
      },
    },
    {
      id: "changeCustomModeText",
      display: "Change custom text",
      exec: () => {
        showCustomTextPopup();
        setTimeout(() => {
          // Workaround to focus textarea since hideCommandLine() will focus test words
          $("#customTextPopup textarea").focus();
        }, 150);
      },
    },
    {
      id: "toggleMonkey",
      display: "Toggle Monkey",
      visible: false,
      exec: () => {
        toggleMonkey();
      },
    },
  ],
};

let commandsPageWidth = {
  title: "Change page width...",
  list: [
    {
      id: "setPageWidth100",
      display: "100",
      exec: () => {
        setPageWidth("100");
      },
    },
    {
      id: "setPageWidth125",
      display: "125",
      exec: () => {
        setPageWidth("125");
      },
    },
    {
      id: "setPageWidth150",
      display: "150",
      exec: () => {
        setPageWidth("150");
      },
    },
    {
      id: "setPageWidth200",
      display: "200",
      exec: () => {
        setPageWidth("200");
      },
    },
    {
      id: "setPageWidthMax",
      display: "max",
      exec: () => {
        setPageWidth("max");
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
        setRepeatQuotes("off");
      },
    },
    {
      id: "setRepeatQuotesTyping",
      display: "typing",
      exec: () => {
        setRepeatQuotes("typing");
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
        setKeymapMode("off");
      },
    },
    {
      id: "setKeymapModeStatic",
      display: "static",
      exec: () => {
        setKeymapMode("static");
      },
    },
    {
      id: "setKeymapModeNext",
      display: "next",
      exec: () => {
        setKeymapMode("next");
      },
    },
    {
      id: "setKeymapModeReact",
      display: "react",
      exec: () => {
        setKeymapMode("react");
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
        setPlaySoundOnClick("off");
      },
    },
    {
      id: "setSoundOnClick1",
      display: "1",
      exec: () => {
        setPlaySoundOnClick("1");
        playClickSound();
      },
    },
    {
      id: "setSoundOnClick2",
      display: "2",
      exec: () => {
        setPlaySoundOnClick("2");
        playClickSound();
      },
    },
    {
      id: "setSoundOnClick3",
      display: "3",
      exec: () => {
        setPlaySoundOnClick("3");
        playClickSound();
      },
    },
    {
      id: "setSoundOnClick4",
      display: "4",
      exec: () => {
        setPlaySoundOnClick("4");
        playClickSound();
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
        setRandomTheme("off");
      },
    },
    {
      id: "setRandomOn",
      display: "on",
      exec: () => {
        setRandomTheme("on");
      },
    },
    {
      id: "setRandomFav",
      display: "fav",
      exec: () => {
        setRandomTheme("fav");
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

let commandsEnableAds = {
  title: "Set enable ads...",
  list: [
    {
      id: "setEnableAdsOff",
      display: "off",
      exec: () => {
        setEnableAds("off");
        Notifications.add("Don't forget to refresh the page!", 0);
      },
    },
    {
      id: "setEnableAdsOn",
      display: "on",
      exec: () => {
        setEnableAds("on");
        Notifications.add("Don't forget to refresh the page!", 0);
      },
    },
    {
      id: "setEnableMax",
      display: "Sellout",
      exec: () => {
        setEnableAds("max");
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
        setCaretStyle("off");
      },
    },
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

let commandsPaceCaretStyle = {
  title: "Change pace caret style...",
  list: [
    {
      id: "setPaceCaretStyleOff",
      display: "off",
      exec: () => {
        setPaceCaretStyle("off");
      },
    },
    {
      id: "setPaceCaretStyleDefault",
      display: "line",
      exec: () => {
        setPaceCaretStyle("default");
      },
    },
    {
      id: "setPaceCaretStyleBlock",
      display: "block",
      exec: () => {
        setPaceCaretStyle("block");
      },
    },
    {
      id: "setPaceCaretStyleOutline",
      display: "outline-block",
      exec: () => {
        setPaceCaretStyle("outline");
      },
    },
    {
      id: "setPaceCaretStyleUnderline",
      display: "underline",
      exec: () => {
        setPaceCaretStyle("underline");
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
        setPaceCaret("off");
      },
    },
    {
      id: "setPaceCaretPb",
      display: "pb",
      exec: () => {
        setPaceCaret("pb");
      },
    },
    {
      id: "setPaceCaretAverage",
      display: "average",
      exec: () => {
        setPaceCaret("average");
      },
    },
    {
      id: "setPaceCaretCustom",
      display: "custom...",
      input: true,
      exec: (input) => {
        setPaceCaretCustomSpeed(input);
        setPaceCaret("custom");
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
        setMinWpm("off");
      },
    },
    {
      id: "setMinWpmCustom",
      display: "custom...",
      input: true,
      exec: (input) => {
        setMinWpmCustomSpeed(input);
        setMinWpm("custom");
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
        setMinAcc("off");
      },
    },
    {
      id: "setMinAccCustom",
      display: "custom...",
      input: true,
      exec: (input) => {
        setMinAccCustom(input);
        setMinAcc("custom");
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
        setKeymapStyle("staggered");
      },
    },
    {
      id: "setKeymapStyleMatrix",
      display: "matrix",
      exec: () => {
        setKeymapStyle("matrix");
      },
    },
    {
      id: "setKeymapStyleSplit",
      display: "split",
      exec: () => {
        setKeymapStyle("split");
      },
    },
    {
      id: "setKeymapStyleSplitMatrix",
      display: "split matrix",
      exec: () => {
        setKeymapStyle("split_matrix");
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
        setHighlightMode("letter");
      },
    },
    {
      id: "setHighlightModeWord",
      display: "word",
      exec: () => {
        setHighlightMode("word");
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
    {
      id: "setTimerStyleMini",
      display: "mini",
      exec: () => {
        setTimerStyle("mini");
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

let commandsSingleListCommandLine = {
  title: "Single list command line...",
  list: [
    {
      id: "singleListCommandLineManual",
      display: "manual",
      exec: () => {
        setSingleListCommandLine("manual");
      },
    },
    {
      id: "singleListCommandLineOn",
      display: "on",
      exec: () => {
        setSingleListCommandLine("on");
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
        setWordCount("10");
        restartTest();
      },
    },
    {
      id: "changeWordCount25",
      display: "25",
      exec: () => {
        setWordCount("25");
        restartTest();
      },
    },
    {
      id: "changeWordCount50",
      display: "50",
      exec: () => {
        setWordCount("50");
        restartTest();
      },
    },
    {
      id: "changeWordCount100",
      display: "100",
      exec: () => {
        setWordCount("100");
        restartTest();
      },
    },
    {
      id: "changeWordCount200",
      display: "200",
      exec: () => {
        setWordCount("200");
        restartTest();
      },
    },
    {
      id: "changeWordCountCustom",
      display: "custom...",
      input: true,
      exec: (input) => {
        setWordCount(input);
        restartTest();
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
        setQuoteLength(-1);
        restartTest();
      },
    },
    {
      id: "changeQuoteLengthShort",
      display: "short",
      exec: () => {
        setQuoteLength(0);
        restartTest();
      },
    },
    {
      id: "changeQuoteLengthMedium",
      display: "medium",
      exec: () => {
        setQuoteLength(1);
        restartTest();
      },
    },
    {
      id: "changeQuoteLengthLong",
      display: "long",
      exec: () => {
        setQuoteLength(2);
        restartTest();
      },
    },
    {
      id: "changeQuoteLengthThicc",
      display: "thicc",
      exec: () => {
        setQuoteLength(3);
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
        setMode("time");
        restartTest();
      },
    },
    {
      id: "changeModeWords",
      display: "words",
      exec: () => {
        setMode("words");
        restartTest();
      },
    },
    {
      id: "changeModeQuote",
      display: "quote",
      exec: () => {
        setMode("quote");
        restartTest();
      },
    },
    {
      id: "changeModeCustom",
      display: "custom",
      exec: () => {
        setMode("custom");
        restartTest();
      },
    },
    {
      id: "changeModeZen",
      display: "zen",
      exec: () => {
        setMode("zen");
        manualRestart = true;
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
        setTimeConfig("15");
        restartTest();
      },
    },
    {
      id: "changeTimeConfig30",
      display: "30",
      exec: () => {
        setTimeConfig("30");
        restartTest();
      },
    },
    {
      id: "changeTimeConfig60",
      display: "60",
      exec: () => {
        setTimeConfig("60");
        restartTest();
      },
    },
    {
      id: "changeTimeConfig120",
      display: "120",
      exec: () => {
        setTimeConfig("120");
        restartTest();
      },
    },
    {
      id: "changeTimeConfigCustom",
      display: "custom...",
      input: true,
      exec: (input) => {
        setTimeConfig(input);
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

let commandsStopOnError = {
  title: "Change stop on error...",
  list: [
    {
      id: "changeStopOnErrorOff",
      display: "off",
      exec: () => {
        setStopOnError("off");
      },
    },
    {
      id: "changeStopOnErrorLetter",
      display: "letter",
      exec: () => {
        setStopOnError("letter");
      },
    },
    {
      id: "changeStopOnErrorWord",
      display: "word",
      exec: () => {
        setStopOnError("word");
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
        setFontSize(1);
        restartTest();
      },
    },
    {
      id: "changeFontSize125",
      display: "1.25x",
      exec: () => {
        setFontSize(125);
        restartTest();
      },
    },
    {
      id: "changeFontSize15",
      display: "1.5x",
      exec: () => {
        setFontSize(15);
        restartTest();
      },
    },
    {
      id: "changeFontSize2",
      display: "2x",
      exec: () => {
        setFontSize(2);
        restartTest();
      },
    },
    {
      id: "changeFontSize3",
      display: "3x",
      exec: () => {
        setFontSize(3);
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
  if (db_getSnapshot().tags.length > 0) {
    commandsTags.list = [];

    commandsTags.list.push({
      id: "clearTags",
      display: "Clear tags",
      exec: () => {
        db_getSnapshot().tags.forEach((tag) => {
          tag.active = false;
        });
        updateTestModesNotice();
        saveActiveTagsToCookie();
      },
    });

    db_getSnapshot().tags.forEach((tag) => {
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

Misc.getThemesList().then((themes) => {
  themes.forEach((theme) => {
    commandsThemes.list.push({
      id: "changeTheme" + Misc.capitalizeFirstLetter(theme.name),
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

function showFavouriteThemesAtTheTop() {
  if (config.favThemes.length > 0) {
    commandsThemes.list = [];
    config.favThemes.forEach((theme) => {
      commandsThemes.list.push({
        id: "changeTheme" + Misc.capitalizeFirstLetter(theme),
        display: theme.replace(/_/g, " "),
        hover: () => {
          previewTheme(theme);
        },
        exec: () => {
          setTheme(theme);
        },
      });
    });
    Misc.getThemesList().then((themes) => {
      themes.forEach((theme) => {
        if (config.favThemes.includes(theme.name)) return;
        commandsThemes.list.push({
          id: "changeTheme" + Misc.capitalizeFirstLetter(theme.name),
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
  }
}

let commandsFonts = {
  title: "Change font...",
  list: [],
};

Misc.getFontsList().then((fonts) => {
  fonts.forEach((font) => {
    commandsFonts.list.push({
      id: "changeFont" + font.name.replace(/ /g, "_"),
      display: font.display !== undefined ? font.display : font.name,
      hover: () => {
        previewFontFamily(font.name);
      },
      exec: () => {
        setFontFamily(font.name.replace(/ /g, "_"));
      },
    });
  });
  commandsFonts.list.push({
    id: "setFontFamilyCustom",
    display: "custom...",
    input: true,
    hover: () => {
      previewFontFamily(config.fontFamily);
    },
    exec: (name) => {
      setFontFamily(name.replace(/\s/g, "_"));
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
        if (activateFunbox("none", null)) {
          restartTest();
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

commandsLanguages.list = [];
Misc.getLanguageList().then((languages) => {
  languages.forEach((language) => {
    commandsLanguages.list.push({
      id: "changeLanguage" + Misc.capitalizeFirstLetter(language),
      display: language.replace(/_/g, " "),
      exec: () => {
        setLanguage(language);
        restartTest();
        saveConfigToCookie();
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
        setSavedLayout(layout);
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
  commandsKeymapLayouts.list.push({
    id: "changeKeymapLayoutOverrideSync",
    display: "override sync",
    exec: () => {
      setKeymapLayout("overrideSync");
      restartTest();
    },
  });
  Object.keys(layouts).forEach((layout) => {
    if (layout.toString() != "default") {
      commandsKeymapLayouts.list.push({
        id: "changeKeymapLayout" + Misc.capitalizeFirstLetter(layout),
        display: layout.replace(/_/g, " "),
        exec: () => {
          setKeymapLayout(layout);
          restartTest();
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
    if (event.keyCode == 27 || (event.keyCode == 9 && config.swapEscAndTab)) {
      event.preventDefault();
      if (!$("#leaderboardsWrapper").hasClass("hidden")) {
        //maybe add more condition for closing other dialogs in the future as well
        event.preventDefault();
        hideLeaderboards();
      } else if (!$("#commandLineWrapper").hasClass("hidden")) {
        if (currentCommands.length > 1) {
          currentCommands.pop();
          $("#commandLine").removeClass("allCommands");
          showCommandLine();
        } else {
          hideCommandLine();
        }
        setFontFamily(config.fontFamily, true);
        if (config.customTheme === true) {
          applyCustomThemeColors();
        } else {
          setTheme(config.theme);
        }
      } else if (event.keyCode == 9 || !config.swapEscAndTab) {
        if (config.singleListCommandLine == "on")
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
  if (isPreviewingTheme) {
    applyCustomThemeColors();
    // previewTheme(config.theme, false);
  }
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
  $(".suggestions .entry").removeClass("activeKeyboard");
  triggerCommand($(e.target).attr("command"));
});

$("#commandLineWrapper").click((e) => {
  if ($(e.target).attr("id") === "commandLineWrapper") {
    hideCommandLine();
    setFontFamily(config.fontFamily, true);
    if (config.customTheme === true) {
      applyCustomThemeColors();
    } else {
      setTheme(config.theme, true);
    }
  }
});

$(document).keydown((e) => {
  if (isPreviewingTheme) {
    console.log("applying theme");
    applyCustomThemeColors();
    // previewTheme(config.theme, false);
  }
  if (!$("#commandLineWrapper").hasClass("hidden")) {
    $("#commandLine input").focus();
    if (e.key == ">" && config.singleListCommandLine == "manual") {
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
      config.singleListCommandLine == "manual" &&
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
  previewFontFamily(config.fontFamily);
  applyCustomThemeColors();
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

let showCommandLine = () => {
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
};

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
    config.singleListCommandLine === "on" &&
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
        if (res != null && res.length > 0) {
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
          obj.hover();
          return false;
        }
      });
    } catch (e) {}
  }
  $("#commandLine .listTitle").remove();
}
