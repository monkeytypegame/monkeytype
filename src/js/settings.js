class SettingsGroup {
  constructor(
    configName,
    toggleFunction,
    setCallback = null,
    updateCallback = null
  ) {
    this.configName = configName;
    this.configValue = Config[configName];
    if (this.configValue === true || this.configValue === false) {
      this.onOff = true;
    } else {
      this.onOff = false;
    }
    this.toggleFunction = toggleFunction;
    this.setCallback = setCallback;
    this.updateCallback = updateCallback;

    this.updateButton();

    $(document).on(
      "click",
      `.pageSettings .section.${this.configName} .button`,
      (e) => {
        let target = $(e.currentTarget);
        if (target.hasClass("disabled") || target.hasClass("no-auto-handle"))
          return;
        if (this.onOff) {
          if (target.hasClass("on")) {
            this.setValue(true);
          } else {
            this.setValue(false);
          }
          this.updateButton();
          if (this.setCallback !== null) this.setCallback();
        } else {
          let value = target.attr(configName);
          let params = target.attr("params");
          this.setValue(value, params);
        }
      }
    );
  }

  setValue(value, params = undefined) {
    if (params === undefined) {
      this.toggleFunction(value);
    } else {
      this.toggleFunction(value, ...params);
    }
    this.updateButton();
    if (this.setCallback !== null) this.setCallback();
  }

  updateButton() {
    this.configValue = Config[this.configName];
    $(`.pageSettings .section.${this.configName} .button`).removeClass(
      "active"
    );
    if (this.onOff) {
      let onoffstring;
      if (this.configValue) {
        onoffstring = "on";
      } else {
        onoffstring = "off";
      }
      $(
        `.pageSettings .section.${this.configName} .buttons .button.${onoffstring}`
      ).addClass("active");
    } else {
      $(
        `.pageSettings .section.${this.configName} .button[${this.configName}='${this.configValue}']`
      ).addClass("active");
    }
    if (this.updateCallback !== null) this.updateCallback();
  }
}

let settingsGroups = {};

settingsGroups.smoothCaret = new SettingsGroup(
  "smoothCaret",
  UpdateConfig.setSmoothCaret
);
settingsGroups.difficulty = new SettingsGroup(
  "difficulty",
  UpdateConfig.setDifficulty
);
settingsGroups.quickTab = new SettingsGroup(
  "quickTab",
  UpdateConfig.setQuickTabMode
);
settingsGroups.showLiveWpm = new SettingsGroup(
  "showLiveWpm",
  UpdateConfig.setShowLiveWpm,
  () => {
    settingsGroups.keymapMode.updateButton();
  }
);
settingsGroups.showLiveAcc = new SettingsGroup(
  "showLiveAcc",
  UpdateConfig.setShowLiveAcc
);
settingsGroups.showTimerProgress = new SettingsGroup(
  "showTimerProgress",
  UpdateConfig.setShowTimerProgress
);
settingsGroups.keymapMode = new SettingsGroup(
  "keymapMode",
  UpdateConfig.setKeymapMode,
  () => {
    settingsGroups.showLiveWpm.updateButton();
  },
  () => {
    if (Config.keymapMode === "off") {
      $(".pageSettings .section.keymapStyle").addClass("hidden");
      $(".pageSettings .section.keymapLayout").addClass("hidden");
    } else {
      $(".pageSettings .section.keymapStyle").removeClass("hidden");
      $(".pageSettings .section.keymapLayout").removeClass("hidden");
    }
  }
);
settingsGroups.keymapMatrix = new SettingsGroup(
  "keymapStyle",
  UpdateConfig.setKeymapStyle
);
settingsGroups.keymapLayout = new SettingsGroup(
  "keymapLayout",
  UpdateConfig.setKeymapLayout
);
settingsGroups.showKeyTips = new SettingsGroup(
  "showKeyTips",
  UpdateConfig.setKeyTips,
  null,
  () => {
    if (Config.showKeyTips) {
      $(".pageSettings .tip").removeClass("hidden");
    } else {
      $(".pageSettings .tip").addClass("hidden");
    }
  }
);
settingsGroups.freedomMode = new SettingsGroup(
  "freedomMode",
  UpdateConfig.setFreedomMode,
  () => {
    settingsGroups.confidenceMode.updateButton();
  }
);
settingsGroups.strictSpace = new SettingsGroup(
  "strictSpace",
  UpdateConfig.setStrictSpace
);
settingsGroups.oppositeShiftMode = new SettingsGroup(
  "oppositeShiftMode",
  UpdateConfig.setOppositeShiftMode
);
settingsGroups.confidenceMode = new SettingsGroup(
  "confidenceMode",
  UpdateConfig.setConfidenceMode,
  () => {
    settingsGroups.freedomMode.updateButton();
    settingsGroups.stopOnError.updateButton();
  }
);
settingsGroups.indicateTypos = new SettingsGroup(
  "indicateTypos",
  UpdateConfig.setIndicateTypos
);
settingsGroups.hideExtraLetters = new SettingsGroup(
  "hideExtraLetters",
  UpdateConfig.setHideExtraLetters
);
settingsGroups.blindMode = new SettingsGroup(
  "blindMode",
  UpdateConfig.setBlindMode
);
settingsGroups.quickEnd = new SettingsGroup(
  "quickEnd",
  UpdateConfig.setQuickEnd
);
settingsGroups.repeatQuotes = new SettingsGroup(
  "repeatQuotes",
  UpdateConfig.setRepeatQuotes
);
settingsGroups.enableAds = new SettingsGroup(
  "enableAds",
  UpdateConfig.setEnableAds
);
settingsGroups.alwaysShowWordsHistory = new SettingsGroup(
  "alwaysShowWordsHistory",
  UpdateConfig.setAlwaysShowWordsHistory
);
settingsGroups.singleListCommandLine = new SettingsGroup(
  "singleListCommandLine",
  UpdateConfig.setSingleListCommandLine
);
settingsGroups.flipTestColors = new SettingsGroup(
  "flipTestColors",
  UpdateConfig.setFlipTestColors
);
settingsGroups.swapEscAndTab = new SettingsGroup(
  "swapEscAndTab",
  UpdateConfig.setSwapEscAndTab
);
settingsGroups.showOutOfFocusWarning = new SettingsGroup(
  "showOutOfFocusWarning",
  UpdateConfig.setShowOutOfFocusWarning
);
settingsGroups.colorfulMode = new SettingsGroup(
  "colorfulMode",
  UpdateConfig.setColorfulMode
);
settingsGroups.startGraphsAtZero = new SettingsGroup(
  "startGraphsAtZero",
  UpdateConfig.setStartGraphsAtZero
);
settingsGroups.randomTheme = new SettingsGroup(
  "randomTheme",
  UpdateConfig.setRandomTheme
);
settingsGroups.stopOnError = new SettingsGroup(
  "stopOnError",
  UpdateConfig.setStopOnError,
  () => {
    settingsGroups.confidenceMode.updateButton();
  }
);
settingsGroups.playSoundOnError = new SettingsGroup(
  "playSoundOnError",
  UpdateConfig.setPlaySoundOnError
);
settingsGroups.playSoundOnClick = new SettingsGroup(
  "playSoundOnClick",
  UpdateConfig.setPlaySoundOnClick,
  () => {
    if (Config.playSoundOnClick !== "off")
      Sound.playClick(Config.playSoundOnClick);
  }
);
settingsGroups.showAllLines = new SettingsGroup(
  "showAllLines",
  UpdateConfig.setShowAllLines
);
settingsGroups.paceCaret = new SettingsGroup(
  "paceCaret",
  UpdateConfig.setPaceCaret,
  () => {
    if (Config.paceCaret === "custom") {
      $(
        ".pageSettings .section.paceCaret input.customPaceCaretSpeed"
      ).removeClass("hidden");
    } else {
      $(".pageSettings .section.paceCaret input.customPaceCaretSpeed").addClass(
        "hidden"
      );
    }
  }
);
settingsGroups.minWpm = new SettingsGroup(
  "minWpm",
  UpdateConfig.setMinWpm,
  () => {
    if (Config.minWpm === "custom") {
      $(".pageSettings .section.minWpm input.customMinWpmSpeed").removeClass(
        "hidden"
      );
    } else {
      $(".pageSettings .section.minWpm input.customMinWpmSpeed").addClass(
        "hidden"
      );
    }
  }
);
settingsGroups.minAcc = new SettingsGroup(
  "minAcc",
  UpdateConfig.setMinAcc,
  () => {
    if (Config.minAcc === "custom") {
      $(".pageSettings .section.minAcc input.customMinAcc").removeClass(
        "hidden"
      );
    } else {
      $(".pageSettings .section.minAcc input.customMinAcc").addClass("hidden");
    }
  }
);
settingsGroups.smoothLineScroll = new SettingsGroup(
  "smoothLineScroll",
  UpdateConfig.setSmoothLineScroll
);
settingsGroups.capsLockBackspace = new SettingsGroup(
  "capsLockBackspace",
  UpdateConfig.setCapsLockBackspace
);
settingsGroups.layout = new SettingsGroup(
  "layout",
  UpdateConfig.setSavedLayout
);
settingsGroups.language = new SettingsGroup(
  "language",
  UpdateConfig.setLanguage
);
settingsGroups.fontSize = new SettingsGroup(
  "fontSize",
  UpdateConfig.setFontSize
);
settingsGroups.pageWidth = new SettingsGroup(
  "pageWidth",
  UpdateConfig.setPageWidth
);
settingsGroups.caretStyle = new SettingsGroup(
  "caretStyle",
  UpdateConfig.setCaretStyle
);
settingsGroups.paceCaretStyle = new SettingsGroup(
  "paceCaretStyle",
  UpdateConfig.setPaceCaretStyle
);
settingsGroups.timerStyle = new SettingsGroup(
  "timerStyle",
  UpdateConfig.setTimerStyle
);
settingsGroups.highlighteMode = new SettingsGroup(
  "highlightMode",
  UpdateConfig.setHighlightMode
);
settingsGroups.timerOpacity = new SettingsGroup(
  "timerOpacity",
  UpdateConfig.setTimerOpacity
);
settingsGroups.timerColor = new SettingsGroup(
  "timerColor",
  UpdateConfig.setTimerColor
);
settingsGroups.fontFamily = new SettingsGroup(
  "fontFamily",
  UpdateConfig.setFontFamily,
  null,
  () => {
    let customButton = $(".pageSettings .section.fontFamily .buttons .custom");
    if ($(".pageSettings .section.fontFamily .buttons .active").length === 0) {
      customButton.addClass("active");
      customButton.text(`Custom (${Config.fontFamily.replace(/_/g, " ")})`);
    } else {
      customButton.text("Custom");
    }
  }
);
settingsGroups.alwaysShowDecimalPlaces = new SettingsGroup(
  "alwaysShowDecimalPlaces",
  UpdateConfig.setAlwaysShowDecimalPlaces
);
settingsGroups.alwaysShowCPM = new SettingsGroup(
  "alwaysShowCPM",
  UpdateConfig.setAlwaysShowCPM
);

let settingsFillPromise = fillSettingsPage();

async function fillSettingsPage() {
  await configLoadPromise;
  refreshThemeButtons();

  let langGroupsEl = $(
    ".pageSettings .section.languageGroups .buttons"
  ).empty();
  let currentLanguageGroup = await Misc.findCurrentGroup(Config.language);
  Misc.getLanguageGroups().then((groups) => {
    groups.forEach((group) => {
      langGroupsEl.append(
        `<div class="languageGroup button${
          currentLanguageGroup === group.name ? " active" : ""
        }" group='${group.name}'>${group.name}</div>`
      );
    });
  });

  let layoutEl = $(".pageSettings .section.layout .buttons").empty();
  Object.keys(layouts).forEach((layout) => {
    layoutEl.append(
      `<div class="layout button" layout='${layout}'>${layout.replace(
        /_/g,
        " "
      )}</div>`
    );
  });

  let keymapEl = $(".pageSettings .section.keymapLayout .buttons").empty();
  keymapEl.append(
    `<div class="layout button" keymapLayout='overrideSync'>override sync</div>`
  );
  Object.keys(layouts).forEach((layout) => {
    if (layout.toString() != "default") {
      keymapEl.append(
        `<div class="layout button" keymapLayout='${layout}'>${layout.replace(
          /_/g,
          " "
        )}</div>`
      );
    }
  });

  let funboxEl = $(".pageSettings .section.funbox .buttons").empty();
  funboxEl.append(`<div class="funbox button" funbox='none'>none</div>`);
  Misc.getFunboxList().then((funboxModes) => {
    funboxModes.forEach((funbox) => {
      if (funbox.name === "mirror") {
        funboxEl.append(
          `<div class="funbox button" funbox='${funbox.name}' aria-label="${
            funbox.info
          }" data-balloon-pos="up" data-balloon-length="fit" type="${
            funbox.type
          }" style="transform:scaleX(-1);">${funbox.name.replace(
            /_/g,
            " "
          )}</div>`
        );
      } else {
        funboxEl.append(
          `<div class="funbox button" funbox='${funbox.name}' aria-label="${
            funbox.info
          }" data-balloon-pos="up" data-balloon-length="fit" type="${
            funbox.type
          }">${funbox.name.replace(/_/g, " ")}</div>`
        );
      }
    });
  });

  let isCustomFont = true;
  let fontsEl = $(".pageSettings .section.fontFamily .buttons").empty();
  Misc.getFontsList().then((fonts) => {
    fonts.forEach((font) => {
      if (Config.fontFamily === font.name) isCustomFont(false);
      fontsEl.append(
        `<div class="button${
          Config.fontFamily === font.name ? " active" : ""
        }" style="font-family:${
          font.display !== undefined ? font.display : font.name
        }" fontFamily="${font.name.replace(/ /g, "_")}" tabindex="0"
        onclick="this.blur();">${
          font.display !== undefined ? font.display : font.name
        }</div>`
      );
    });
    $(
      isCustomFont
        ? `<div class="language button no-auto-handle custom active" onclick="this.blur();">Custom (${Config.fontFamily.replace(
            /_/g,
            " "
          )})</div>`
        : '<div class="language button no-auto-handle custom" onclick="this.blur();">Custom</div>'
    )
      .on("click", () => {
        simplePopups.applyCustomFont.show([]);
      })
      .appendTo(fontsEl);
  });
}

function refreshThemeButtons() {
  let favThemesEl = $(
    ".pageSettings .section.themes .favThemes.buttons"
  ).empty();
  let themesEl = $(".pageSettings .section.themes .allThemes.buttons").empty();

  let activeThemeName = Config.theme;
  if (Config.randomTheme !== "off" && ThemeController.randomTheme !== null) {
    activeThemeName = ThemeController.randomTheme;
  }

  Misc.getSortedThemesList().then((themes) => {
    //first show favourites
    if (Config.favThemes.length > 0) {
      favThemesEl.css({ paddingBottom: "1rem" });
      themes.forEach((theme) => {
        if (Config.favThemes.includes(theme.name)) {
          let activeTheme = activeThemeName === theme.name ? "active" : "";
          favThemesEl.append(
            `<div class="theme button" theme='${theme.name}' style="color:${
              theme.textColor
            };background:${theme.bgColor}">
          <div class="activeIndicator ${activeTheme}"><i class="fas fa-circle"></i></div>
          <div class="text">${theme.name.replace(/_/g, " ")}</div>
          <div class="favButton active"><i class="fas fa-star"></i></div></div>`
          );
        }
      });
    } else {
      favThemesEl.css({ paddingBottom: "0" });
    }
    //then the rest
    themes.forEach((theme) => {
      if (!Config.favThemes.includes(theme.name)) {
        let activeTheme = activeThemeName === theme.name ? "active" : "";
        themesEl.append(
          `<div class="theme button" theme='${theme.name}' style="color:${
            theme.textColor
          };background:${theme.bgColor}">
          <div class="activeIndicator ${activeTheme}"><i class="fas fa-circle"></i></div>
          <div class="text">${theme.name.replace(/_/g, " ")}</div>
          <div class="favButton"><i class="far fa-star"></i></div></div>`
        );
      }
    });
  });
}

function updateSettingsPage() {
  Object.keys(settingsGroups).forEach((group) => {
    settingsGroups[group].updateButton();
  });

  refreshTagsSettingsSection();
  LanguagePicker.setActiveGroup();
  setActiveFunboxButton();
  setActiveThemeButton();
  setActiveThemeTab();
  setCustomThemeInputs();
  updateDiscordSettingsSection();
  refreshThemeButtons();

  if (Config.paceCaret === "custom") {
    $(
      ".pageSettings .section.paceCaret input.customPaceCaretSpeed"
    ).removeClass("hidden");
    $(".pageSettings .section.paceCaret input.customPaceCaretSpeed").val(
      Config.paceCaretCustomSpeed
    );
  } else {
    $(".pageSettings .section.paceCaret input.customPaceCaretSpeed").addClass(
      "hidden"
    );
  }

  if (Config.minWpm === "custom") {
    $(".pageSettings .section.minWpm input.customMinWpmSpeed").removeClass(
      "hidden"
    );
    $(".pageSettings .section.minWpm input.customMinWpmSpeed").val(
      Config.minWpmCustomSpeed
    );
  } else {
    $(".pageSettings .section.minWpm input.customMinWpmSpeed").addClass(
      "hidden"
    );
  }

  if (Config.minAcc === "custom") {
    $(".pageSettings .section.minAcc input.customMinAcc").removeClass("hidden");
    $(".pageSettings .section.minAcc input.customMinAcc").val(
      Config.minAccCustom
    );
  } else {
    $(".pageSettings .section.minAcc input.customMinAcc").addClass("hidden");
  }
}

function showCustomThemeShare() {
  if ($("#customThemeShareWrapper").hasClass("hidden")) {
    let save = [];
    $.each(
      $(".pageSettings .section.customTheme [type='color']"),
      (index, element) => {
        save.push($(element).attr("value"));
      }
    );
    $("#customThemeShareWrapper input").val(JSON.stringify(save));
    $("#customThemeShareWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, (e) => {
        $("#customThemeShare input").focus();
        $("#customThemeShare input").select();
        $("#customThemeShare input").focus();
      });
  }
}

function hideCustomThemeShare() {
  if (!$("#customThemeShareWrapper").hasClass("hidden")) {
    try {
      UpdateConfig.setCustomThemeColors(
        JSON.parse($("#customThemeShareWrapper input").val())
      );
    } catch (e) {
      Notifications.add(
        "Something went wrong. Reverting to default custom colors.",
        0,
        4
      );
      UpdateConfig.setCustomThemeColors(Config.defaultConfig.customThemeColors);
    }
    setCustomThemeInputs();
    // applyCustomThemeColors();
    $("#customThemeShareWrapper input").val("");
    $("#customThemeShareWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        (e) => {
          $("#customThemeShareWrapper").addClass("hidden");
        }
      );
  }
}

$("#customThemeShareWrapper").click((e) => {
  if ($(e.target).attr("id") === "customThemeShareWrapper") {
    hideCustomThemeShare();
  }
});

$("#customThemeShare .button").click((e) => {
  hideCustomThemeShare();
});

$("#shareCustomThemeButton").click((e) => {
  if (e.shiftKey) {
    showCustomThemeShare();
  } else {
    let share = [];
    $.each(
      $(".pageSettings .section.customTheme [type='color']"),
      (index, element) => {
        share.push($(element).attr("value"));
      }
    );

    let url =
      "https://monkeytype.com?" +
      Misc.objectToQueryString({ customTheme: share });
    navigator.clipboard.writeText(url).then(
      function () {
        Notifications.add("URL Copied to clipboard", 0);
      },
      function (err) {
        Notifications.add(
          "Something went wrong when copying the URL: " + err,
          -1
        );
      }
    );
  }
});

function toggleFavouriteTheme(themename) {
  if (Config.favThemes.includes(themename)) {
    //already favourite, remove
    UpdateConfig.setFavThemes(
      UpdateConfig.favThemes.filter((t) => {
        if (t !== themename) {
          return t;
        }
      })
    );
  } else {
    //add to favourites
    UpdateConfig.favThemes.push(themename);
  }
  UpdateConfig.saveToCookie();
  refreshThemeButtons();
  // showFavouriteThemesAtTheTop();
  CommandlineLists.updateThemeCommands();
}

function showAccountSettingsSection() {
  $(`.sectionGroupTitle[group='account']`).removeClass("hidden");
  $(`.settingsGroup.account`).removeClass("hidden");
  refreshTagsSettingsSection();
  updateDiscordSettingsSection();
}

function hideAccountSettingsSection() {
  $(`.sectionGroupTitle[group='account']`).addClass("hidden");
  $(`.settingsGroup.account`).addClass("hidden");
}

function refreshTagsSettingsSection() {
  if (firebase.auth().currentUser !== null && DB.getSnapshot() !== null) {
    let tagsEl = $(".pageSettings .section.tags .tagsList").empty();
    DB.getSnapshot().tags.forEach((tag) => {
      let tagPbString = "No PB found";
      if (tag.pb != undefined && tag.pb > 0) {
        tagPbString = `PB: ${tag.pb}`;
      }
      if (tag.active === true) {
        tagsEl.append(`

              <div class="tag" id="${tag.id}">
                  <div class="active" active="true">
                      <i class="fas fa-check-square"></i>
                  </div>
                  <div class="title">${tag.name}</div>
                  <div class="editButton"><i class="fas fa-pen"></i></div>
                  <div class="clearPbButton hidden" aria-label="${tagPbString}" data-balloon-pos="up"><i class="fas fa-crown"></i></div>
                  <div class="removeButton"><i class="fas fa-trash"></i></div>
              </div>

            `);
      } else {
        tagsEl.append(`

              <div class="tag" id="${tag.id}">
                  <div class="active" active="false">
                      <i class="fas fa-square"></i>
                  </div>
                  <div class="title">${tag.name}</div>
                  <div class="editButton"><i class="fas fa-pen"></i></div>
                  <div class="clearPbButton hidden" aria-label="${tagPbString}" data-balloon-pos="up"><i class="fas fa-crown"></i></div>
                  <div class="removeButton"><i class="fas fa-trash"></i></div>
              </div>

            `);
      }
    });
    $(".pageSettings .section.tags").removeClass("hidden");
  } else {
    $(".pageSettings .section.tags").addClass("hidden");
  }
}

function setActiveFunboxButton() {
  $(`.pageSettings .section.funbox .button`).removeClass("active");
  $(
    `.pageSettings .section.funbox .button[funbox='${Funbox.active}']`
  ).addClass("active");
}

function setActiveThemeButton() {
  $(`.pageSettings .section.themes .theme`).removeClass("active");
  $(`.pageSettings .section.themes .theme[theme=${Config.theme}]`).addClass(
    "active"
  );
}

function setActiveThemeTab() {
  Config.customTheme === true
    ? $(".pageSettings .section.themes .tabs .button[tab='custom']").click()
    : $(".pageSettings .section.themes .tabs .button[tab='preset']").click();
}

function setCustomThemeInputs() {
  $(
    ".pageSettings .section.themes .tabContainer .customTheme input[type=color]"
  ).each((n, index) => {
    let currentColor =
      Config.customThemeColors[colorVars.indexOf($(index).attr("id"))];
    $(index).val(currentColor);
    $(index).attr("value", currentColor);
    $(index).prev().text(currentColor);
  });
}

function showActiveTags() {
  DB.getSnapshot().tags.forEach((tag) => {
    if (tag.active === true) {
      $(
        `.pageSettings .section.tags .tagsList .tag[id='${tag.id}'] .active`
      ).html('<i class="fas fa-check-square"></i>');
    } else {
      $(
        `.pageSettings .section.tags .tagsList .tag[id='${tag.id}'] .active`
      ).html('<i class="fas fa-square"></i>');
    }
  });
}

function updateDiscordSettingsSection() {
  //no code and no discord
  if (firebase.auth().currentUser == null) {
    $(".pageSettings .section.discordIntegration").addClass("hidden");
  } else {
    if (DB.getSnapshot() == null) return;
    $(".pageSettings .section.discordIntegration").removeClass("hidden");

    if (DB.getSnapshot().discordId == undefined) {
      //show button
      $(".pageSettings .section.discordIntegration .buttons").removeClass(
        "hidden"
      );
      $(".pageSettings .section.discordIntegration .info").addClass("hidden");
    } else {
      $(".pageSettings .section.discordIntegration .buttons").addClass(
        "hidden"
      );
      $(".pageSettings .section.discordIntegration .info").removeClass(
        "hidden"
      );
    }
  }
}

$(document).on(
  "focusout",
  ".pageSettings .section.paceCaret input.customPaceCaretSpeed",
  (e) => {
    UpdateConfig.setPaceCaretCustomSpeed(
      parseInt(
        $(".pageSettings .section.paceCaret input.customPaceCaretSpeed").val()
      )
    );
  }
);

$(document).on(
  "focusout",
  ".pageSettings .section.minWpm input.customMinWpmSpeed",
  (e) => {
    UpdateConfig.setMinWpmCustomSpeed(
      parseInt($(".pageSettings .section.minWpm input.customMinWpmSpeed").val())
    );
  }
);

$(document).on(
  "focusout",
  ".pageSettings .section.minAcc input.customMinAcc",
  (e) => {
    UpdateConfig.setMinAccCustom(
      parseInt($(".pageSettings .section.minAcc input.customMinAcc").val())
    );
  }
);

$(document).on("click", ".pageSettings .section.themes .theme.button", (e) => {
  let theme = $(e.currentTarget).attr("theme");
  if (!$(e.target).hasClass("favButton")) {
    UpdateConfig.setTheme(theme);
    setActiveThemeButton();
    refreshThemeButtons();
  }
});

$(document).on(
  "click",
  ".pageSettings .section.themes .theme .favButton",
  (e) => {
    let theme = $(e.currentTarget).parents(".theme.button").attr("theme");
    toggleFavouriteTheme(theme);
  }
);

$(document).on(
  "click",
  ".pageSettings .section.languageGroups .button",
  (e) => {
    let group = $(e.currentTarget).attr("group");
    LanguagePicker.setActiveGroup(group, true);
  }
);

//discord
$(
  ".pageSettings .section.discordIntegration .buttons .generateCodeButton"
).click((e) => {
  showBackgroundLoader();
  CloudFunctions.generatePairingCode({ uid: firebase.auth().currentUser.uid })
    .then((ret) => {
      hideBackgroundLoader();
      if (ret.data.status === 1 || ret.data.status === 2) {
        DB.getSnapshot().pairingCode = ret.data.pairingCode;
        $(".pageSettings .section.discordIntegration .code .bottom").text(
          ret.data.pairingCode
        );
        $(".pageSettings .section.discordIntegration .howtocode").text(
          ret.data.pairingCode
        );
        updateDiscordSettingsSection();
      }
    })
    .catch((e) => {
      hideBackgroundLoader();
      Notifications.add("Something went wrong. Error: " + e.message, -1);
    });
});

$(".pageSettings .section.discordIntegration #unlinkDiscordButton").click(
  (e) => {
    if (confirm("Are you sure?")) {
      showBackgroundLoader();
      CloudFunctions.unlinkDiscord({
        uid: firebase.auth().currentUser.uid,
      }).then((ret) => {
        hideBackgroundLoader();
        console.log(ret);
        if (ret.data.status === 1) {
          DB.getSnapshot().discordId = null;
          Notifications.add("Accounts unlinked", 0);
          updateDiscordSettingsSection();
        } else {
          Notifications.add("Something went wrong: " + ret.data.message, -1);
          updateDiscordSettingsSection();
        }
      });
    }
  }
);

//funbox
$(document).on("click", ".pageSettings .section.funbox .button", (e) => {
  let funbox = $(e.currentTarget).attr("funbox");
  let type = $(e.currentTarget).attr("type");
  Funbox.activate(funbox, type);
  setActiveFunboxButton();
});

//tags
$(document).on(
  "click",
  ".pageSettings .section.tags .tagsList .tag .active",
  (e) => {
    let target = e.currentTarget;
    let tagid = $(target).parent(".tag").attr("id");
    TagController.toggle(tagid);
    showActiveTags();
  }
);

$(document).on("click", ".pageSettings .section.tags .addTagButton", (e) => {
  showEditTags("add");
});

$(document).on(
  "click",
  ".pageSettings .section.tags .tagsList .tag .clearPbButton",
  (e) => {
    let target = e.currentTarget;
    let tagid = $(target).parent(".tag").attr("id");
    let tagname = $(target).siblings(".title")[0].innerHTML;
    simplePopups.clearTagPb.show([tagid, tagname]);
  }
);

$(document).on(
  "click",
  ".pageSettings .section.tags .tagsList .tag .editButton",
  (e) => {
    let tagid = $(e.currentTarget).parent(".tag").attr("id");
    let name = $(e.currentTarget).siblings(".title").text();
    showEditTags("edit", tagid, name);
  }
);

$(document).on(
  "click",
  ".pageSettings .section.tags .tagsList .tag .removeButton",
  (e) => {
    let tagid = $(e.currentTarget).parent(".tag").attr("id");
    let name = $(e.currentTarget).siblings(".title").text();
    showEditTags("remove", tagid, name);
  }
);

//theme tabs & custom theme
const colorVars = ThemeController.colorVars;

$(".pageSettings .section.themes .tabs .button").click((e) => {
  $(".pageSettings .section.themes .tabs .button").removeClass("active");
  var $target = $(e.currentTarget);
  $target.addClass("active");
  setCustomThemeInputs();
  if ($target.attr("tab") == "preset") {
    UpdateConfig.setCustomTheme(false);
    ThemeController.set(Config.theme);
    // applyCustomThemeColors();
    swapElements(
      $('.pageSettings .section.themes .tabContainer [tabContent="custom"]'),
      $('.pageSettings .section.themes .tabContainer [tabContent="preset"]'),
      250
    );
  } else {
    UpdateConfig.setCustomTheme(true);
    ThemeController.set("custom");
    // applyCustomThemeColors();
    swapElements(
      $('.pageSettings .section.themes .tabContainer [tabContent="preset"]'),
      $('.pageSettings .section.themes .tabContainer [tabContent="custom"]'),
      250
    );
  }
});

$(
  ".pageSettings .section.themes .tabContainer .customTheme input[type=color]"
).on("input", (e) => {
  UpdateConfig.setCustomTheme(true, true);
  let $colorVar = $(e.currentTarget).attr("id");
  let $pickedColor = $(e.currentTarget).val();

  document.documentElement.style.setProperty($colorVar, $pickedColor);
  $(".colorPicker #" + $colorVar).attr("value", $pickedColor);
  $(".colorPicker [for=" + $colorVar + "]").text($pickedColor);
});

$(".pageSettings .saveCustomThemeButton").click((e) => {
  let save = [];
  $.each(
    $(".pageSettings .section.customTheme [type='color']"),
    (index, element) => {
      save.push($(element).attr("value"));
    }
  );
  UpdateConfig.setCustomThemeColors(save);
  ThemeController.set("custom");
  Notifications.add("Custom theme colors saved", 0);
});

$(".pageSettings #loadCustomColorsFromPreset").click((e) => {
  // previewTheme(Config.theme);
  ThemeController.preview(Config.theme);

  colorVars.forEach((e) => {
    document.documentElement.style.setProperty(e, "");
  });

  setTimeout(() => {
    ChartController.updateAllChartColors();

    colorVars.forEach((colorName) => {
      let color;
      if (colorName === "--bg-color") {
        color = ThemeColors.bg;
      } else if (colorName === "--main-color") {
        color = ThemeColors.main;
      } else if (colorName === "--sub-color") {
        color = ThemeColors.sub;
      } else if (colorName === "--caret-color") {
        color = ThemeColors.caret;
      } else if (colorName === "--text-color") {
        color = ThemeColors.text;
      } else if (colorName === "--error-color") {
        color = ThemeColors.error;
      } else if (colorName === "--error-extra-color") {
        color = ThemeColors.errorExtra;
      } else if (colorName === "--colorful-error-color") {
        color = ThemeColors.colorfulError;
      } else if (colorName === "--colorful-error-extra-color") {
        color = ThemeColors.colorfulErrorExtra;
      }
      $(".colorPicker #" + colorName).attr("value", color);
      $(".colorPicker #" + colorName).val(color);
      $(".colorPicker [for=" + colorName + "]").text(color);
    });
  }, 250);
});

$("#resetSettingsButton").click((e) => {
  if (confirm("Press OK to confirm.")) {
    UpdateConfig.reset();
    setTimeout(() => {
      location.reload();
    }, 1000);
  }
});

$("#exportSettingsButton").click((e) => {
  let configJSON = JSON.stringify(Config);
  navigator.clipboard.writeText(configJSON).then(
    function () {
      Notifications.add("JSON Copied to clipboard", 0);
    },
    function (err) {
      Notifications.add(
        "Something went wrong when copying the settings JSON: " + err,
        -1
      );
    }
  );
});

function showSettingsImport() {
  if ($("#settingsImportWrapper").hasClass("hidden")) {
    $("#settingsImportWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, (e) => {
        $("#settingsImportWrapper input").focus();
        $("#settingsImportWrapper input").select();
        $("#settingsImportWrapper input").focus();
      });
  }
}

function hideSettingsImport() {
  if (!$("#settingsImportWrapper").hasClass("hidden")) {
    if ($("#settingsImportWrapper input").val() !== "") {
      try {
        UpdateConfig.apply(JSON.parse($("#settingsImportWrapper input").val()));
      } catch (e) {
        Notifications.add(
          "An error occured while importing settings: " + e,
          -1
        );
      }
      UpdateConfig.saveToCookie();
      updateSettingsPage();
    }
    $("#settingsImportWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate({ opacity: 0 }, 100, (e) => {
        $("#settingsImportWrapper").addClass("hidden");
      });
  }
}

$("#importSettingsButton").click((e) => {
  showSettingsImport();
});

$("#settingsImport .button").click((e) => {
  hideSettingsImport();
});

$("#settingsImportWrapper").click((e) => {
  if ($(e.target).attr("id") === "settingsImportWrapper") {
    hideSettingsImport();
  }
});

$(".pageSettings .sectionGroupTitle").click((e) => {
  let group = $(e.currentTarget).attr("group");
  $(`.pageSettings .settingsGroup.${group}`)
    .stop(true, true)
    .slideToggle(250)
    .toggleClass("slideup");
  if ($(`.pageSettings .settingsGroup.${group}`).hasClass("slideup")) {
    $(`.pageSettings .sectionGroupTitle[group=${group}] .fas`)
      .stop(true, true)
      .animate(
        {
          deg: -90,
        },
        {
          duration: 250,
          step: function (now) {
            $(this).css({ transform: "rotate(" + now + "deg)" });
          },
        }
      );
  } else {
    $(`.pageSettings .sectionGroupTitle[group=${group}] .fas`)
      .stop(true, true)
      .animate(
        {
          deg: 0,
        },
        {
          duration: 250,
          step: function (now) {
            $(this).css({ transform: "rotate(" + now + "deg)" });
          },
        }
      );
  }
});
