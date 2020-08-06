class SettingsGroup {
  constructor(
    configName,
    toggleFunction,
    setCallback = null,
    updateCallback = null
  ) {
    this.configName = configName;
    this.configValue = config[configName];
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
        if (this.onOff) {
          if ($(e.currentTarget).hasClass("on")) {
            this.toggleFunction(true);
          } else {
            this.toggleFunction(false);
          }
          this.updateButton();
          if (this.setCallback !== null) this.setCallback();
        } else {
          let value = $(e.currentTarget).attr(configName);
          let params = $(e.currentTarget).attr("params");
          if (params === undefined) {
            this.toggleFunction(value);
          } else {
            this.toggleFunction(value, ...params);
          }
          this.updateButton();
          if (this.setCallback !== null) this.setCallback();
        }
      }
    );
  }

  updateButton() {
    this.configValue = config[this.configName];
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

settingsGroups.smoothCaret = new SettingsGroup("smoothCaret", setSmoothCaret);
settingsGroups.difficulty = new SettingsGroup("difficulty", setDifficulty);
settingsGroups.quickTab = new SettingsGroup("quickTab", setQuickTabMode);
settingsGroups.showLiveWpm = new SettingsGroup(
  "showLiveWpm",
  setShowLiveWpm,
  () => {
    settingsGroups.keymapMode.updateButton();
  }
);
settingsGroups.showTimerProgress = new SettingsGroup(
  "showTimerProgress",
  setShowTimerProgress
);
settingsGroups.keymapMode = new SettingsGroup(
  "keymapMode",
  changeKeymapMode,
  () => {
    settingsGroups.showLiveWpm.updateButton();
  },
  () => {
    if (config.keymapMode === "off") {
      $(".pageSettings .section.keymapLayout").addClass("hidden");
    } else {
      $(".pageSettings .section.keymapLayout").removeClass("hidden");
    }
  }
);
settingsGroups.keymapLayout = new SettingsGroup(
  "keymapLayout",
  changeKeymapLayout
);
settingsGroups.quickTab = new SettingsGroup(
  "showKeyTips",
  setKeyTips,
  null,
  () => {
    if (config.showKeyTips) {
      $(".pageSettings .tip").removeClass("hidden");
    } else {
      $(".pageSettings .tip").addClass("hidden");
    }
  }
);
settingsGroups.freedomMode = new SettingsGroup(
  "freedomMode",
  setFreedomMode,
  () => {
    settingsGroups.confidenceMode.updateButton();
  }
);
settingsGroups.confidenceMode = new SettingsGroup(
  "confidenceMode",
  setConfidenceMode,
  () => {
    settingsGroups.freedomMode.updateButton();
  }
);
settingsGroups.blindMode = new SettingsGroup("blindMode", setBlindMode);
settingsGroups.quickEnd = new SettingsGroup("quickEnd", setQuickEnd);
settingsGroups.alwaysShowWordsHistory = new SettingsGroup(
  "alwaysShowWordsHistory",
  setAlwaysShowWordsHistory
);
settingsGroups.flipTestColors = new SettingsGroup(
  "flipTestColors",
  setFlipTestColors
);
settingsGroups.colorfulMode = new SettingsGroup(
  "colorfulMode",
  setColorfulMode
);
settingsGroups.randomTheme = new SettingsGroup("randomTheme", setRandomTheme);
settingsGroups.stopOnError = new SettingsGroup("stopOnError", setStopOnError);
settingsGroups.showAllLines = new SettingsGroup(
  "showAllLines",
  setShowAllLines
);
settingsGroups.smoothLineScroll = new SettingsGroup(
  "smoothLineScroll",
  setSmoothLineScroll
);
settingsGroups.layout = new SettingsGroup("layout", changeLayout);
settingsGroups.language = new SettingsGroup("language", changeLanguage);
settingsGroups.fontSize = new SettingsGroup("fontSize", changeFontSize);
settingsGroups.caretStyle = new SettingsGroup("caretStyle", setCaretStyle);
settingsGroups.timerStyle = new SettingsGroup("timerStyle", setTimerStyle);
settingsGroups.timerOpacity = new SettingsGroup(
  "timerOpacity",
  setTimerOpacity
);
settingsGroups.timerColor = new SettingsGroup("timerColor", setTimerColor);
settingsGroups.fontFamily = new SettingsGroup("fontFamily", setFontFamily);
settingsGroups.alwaysShowDecimalPlaces = new SettingsGroup(
  "alwaysShowDecimalPlaces",
  setAlwaysShowDecimalPlaces
);

fillSettingsPage();

async function fillSettingsPage() {
  let themesEl = $(".pageSettings .section.themes .buttons").empty();

  getThemesList().then((themes) => {
    themes = themes.sort((a, b) => {
      let b1 = hexToHSL(a.bgColor);
      let b2 = hexToHSL(b.bgColor);
      return b2.lgt - b1.lgt;
    });
    themes.forEach((theme) => {
      themesEl.append(
        `<div class="theme button" theme='${theme.name}' style="color:${
          theme.textColor
        };background:${theme.bgColor}">${theme.name.replace(/_/g, " ")}</div>`
      );
    });
  });

  let langEl = $(".pageSettings .section.language .buttons").empty();
  Object.keys(words).forEach((language) => {
    if (language === "english_10k") return;
    langEl.append(
      `<div class="language button" language='${language}'>${language.replace(
        "_",
        " "
      )}</div>`
    );
    if (language === "english_expanded") {
      langEl.append(
        `<div class="language button" language='english_10k'>english 10k</div>`
      );
    }
  });

  let layoutEl = $(".pageSettings .section.layout .buttons").empty();
  Object.keys(layouts).forEach((layout) => {
    layoutEl.append(
      `<div class="layout button" layout='${layout}'>${layout.replace(
        "_",
        " "
      )}</div>`
    );
  });

  let keymapEl = $(".pageSettings .section.keymapLayout .buttons").empty();
  Object.keys(layouts).forEach((layout) => {
    if (layout.toString() != "default") {
      keymapEl.append(
        `<div class="layout button" keymapLayout='${layout}'>${layout.replace(
          "_",
          " "
        )}</div>`
      );
    }
  });

  let funboxEl = $(".pageSettings .section.funbox .buttons").empty();
  funboxEl.append(`<div class="funbox button" funbox='none'>none</div>`);
  getFunboxList().then((funboxModes) => {
    funboxModes.forEach((funbox) => {
      if (funbox.name === "mirror") {
        funboxEl.append(
          `<div class="funbox button" funbox='${funbox.name}' type="${
            funbox.type
          }" style="transform:scaleX(-1);">${funbox.name.replace(
            /_/g,
            " "
          )}</div>`
        );
      } else {
        funboxEl.append(
          `<div class="funbox button" funbox='${funbox.name}' type="${
            funbox.type
          }">${funbox.name.replace(/_/g, " ")}</div>`
        );
      }
    });
  });

  let fontsEl = $(".pageSettings .section.fontFamily .buttons").empty();
  getFontsList().then((fonts) => {
    fonts.forEach((font) => {
      fontsEl.append(
        `<div class="button" style="font-family:${
          font.display !== undefined ? font.display : font.name
        }" fontFamily="${font.name.replace(/ /g, "_")}" tabindex="0"
        onclick="this.blur();">${
          font.display !== undefined ? font.display : font.name
        }</div>`
      );
    });
  });
}

function updateSettingsPage() {
  Object.keys(settingsGroups).forEach((group) => {
    settingsGroups[group].updateButton();
  });

  refreshTagsSettingsSection();
  setActiveFunboxButton();
  setActiveThemeButton();
  setActiveThemeTab();
  setCustomThemeInputs();
  updateDiscordSettingsSection();
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
      config.customThemeColors = JSON.parse(
        $("#customThemeShareWrapper input").val()
      );
    } catch (e) {
      showNotification(
        "Something went wrong. Reverting to default custom colors.",
        3000
      );
      config.customThemeColors = defaultConfig.customThemeColors;
    }
    setCustomThemeInputs();
    applyCustomThemeColors();
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
  showCustomThemeShare();
});

function refreshTagsSettingsSection() {
  if (firebase.auth().currentUser !== null && dbSnapshot !== null) {
    let tagsEl = $(".pageSettings .section.tags .tagsList").empty();
    dbSnapshot.tags.forEach((tag) => {
      if (tag.active === true) {
        tagsEl.append(`
          
              <div class="tag" id="${tag.id}">
                  <div class="active" active="true">
                      <i class="fas fa-check-square"></i>
                  </div>
                  <div class="title">${tag.name}</div>
                  <div class="editButton"><i class="fas fa-pen"></i></div>
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
  $(`.pageSettings .section.funbox .button[funbox=${activeFunBox}]`).addClass(
    "active"
  );
}

function setActiveThemeButton() {
  $(`.pageSettings .section.themes .theme`).removeClass("active");
  $(`.pageSettings .section.themes .theme[theme=${config.theme}]`).addClass(
    "active"
  );
}

function setActiveThemeTab() {
  config.customTheme === true
    ? $(".pageSettings .section.themes .tabs .button[tab='custom']").click()
    : $(".pageSettings .section.themes .tabs .button[tab='preset']").click();
}

function setCustomThemeInputs() {
  $(
    ".pageSettings .section.themes .tabContainer .customTheme input[type=color]"
  ).each((n, index) => {
    let currentColor =
      config.customThemeColors[colorVars.indexOf($(index).attr("id"))];
    $(index).val(currentColor);
    $(index).attr("value", currentColor);
    $(index).prev().text(currentColor);
  });
}

function showActiveTags() {
  dbSnapshot.tags.forEach((tag) => {
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

function toggleTag(tagid, nosave = false) {
  dbSnapshot.tags.forEach((tag) => {
    if (tag.id === tagid) {
      if (tag.active === undefined) {
        tag.active = true;
      } else {
        tag.active = !tag.active;
      }
    }
  });
  updateTestModesNotice();
  if (!nosave) saveActiveTagsToCookie();
}

function updateDiscordSettingsSection() {
  //no code and no discord
  if (firebase.auth().currentUser == null) {
    $(".pageSettings .section.discordIntegration").addClass("hidden");
  } else {
    if (dbSnapshot == null) return;
    $(".pageSettings .section.discordIntegration").removeClass("hidden");

    if (
      dbSnapshot.pairingCode === undefined &&
      dbSnapshot.discordId === undefined
    ) {
      //show button
      $(".pageSettings .section.discordIntegration .howto").addClass("hidden");
      $(".pageSettings .section.discordIntegration .buttons").removeClass(
        "hidden"
      );
      $(".pageSettings .section.discordIntegration .info").addClass("hidden");
      $(".pageSettings .section.discordIntegration .code").addClass("hidden");
    } else if (
      dbSnapshot.pairingCode !== undefined &&
      dbSnapshot.discordId === undefined
    ) {
      //show code
      $(".pageSettings .section.discordIntegration .code .bottom").text(
        dbSnapshot.pairingCode
      );
      $(".pageSettings .section.discordIntegration .howtocode").text(
        dbSnapshot.pairingCode
      );
      $(".pageSettings .section.discordIntegration .howto").removeClass(
        "hidden"
      );
      $(".pageSettings .section.discordIntegration .buttons").addClass(
        "hidden"
      );
      $(".pageSettings .section.discordIntegration .info").addClass("hidden");
      $(".pageSettings .section.discordIntegration .code").removeClass(
        "hidden"
      );
    } else if (
      dbSnapshot.pairingCode !== undefined &&
      dbSnapshot.discordId !== undefined
    ) {
      $(".pageSettings .section.discordIntegration .howto").addClass("hidden");
      $(".pageSettings .section.discordIntegration .buttons").addClass(
        "hidden"
      );
      $(".pageSettings .section.discordIntegration .info").removeClass(
        "hidden"
      );
      $(".pageSettings .section.discordIntegration .code").addClass("hidden");
    }
  }
}

$(document).on("click", ".pageSettings .section.themes .theme", (e) => {
  let theme = $(e.currentTarget).attr("theme");
  setTheme(theme);
  setActiveThemeButton();
});

//discord
$(
  ".pageSettings .section.discordIntegration .buttons .generateCodeButton"
).click((e) => {
  showBackgroundLoader();
  generatePairingCode({ uid: firebase.auth().currentUser.uid }).then((ret) => {
    hideBackgroundLoader();
    if (ret.data.status === 1 || ret.data.status === 2) {
      dbSnapshot.pairingCode = ret.data.pairingCode;
      $(".pageSettings .section.discordIntegration .code .bottom").text(
        ret.data.pairingCode
      );
      $(".pageSettings .section.discordIntegration .howtocode").text(
        ret.data.pairingCode
      );
      updateDiscordSettingsSection();
    }
  });
});

//funbox
$(document).on("click", ".pageSettings .section.funbox .button", (e) => {
  let funbox = $(e.currentTarget).attr("funbox");
  let type = $(e.currentTarget).attr("type");
  activateFunbox(funbox, type);
  setActiveFunboxButton();
});

//tags
$(document).on(
  "click",
  ".pageSettings .section.tags .tagsList .tag .active",
  (e) => {
    let target = e.currentTarget;
    let tagid = $(target).parent(".tag").attr("id");
    toggleTag(tagid);
    showActiveTags();
  }
);

$(document).on("click", ".pageSettings .section.tags .addTagButton", (e) => {
  showEditTags("add");
});

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
const colorVars = [
  "--bg-color",
  "--main-color",
  "--caret-color",
  "--sub-color",
  "--text-color",
  "--error-color",
  "--error-extra-color",
  "--colorful-error-color",
  "--colorful-error-extra-color",
];

$(".pageSettings .section.themes .tabs .button").click((e) => {
  $(".pageSettings .section.themes .tabs .button").removeClass("active");
  var $target = $(e.currentTarget);
  $target.addClass("active");
  setCustomThemeInputs();
  if ($target.attr("tab") == "preset") {
    setCustomTheme(false);
    applyCustomThemeColors();
    swapElements(
      $('.pageSettings .section.themes .tabContainer [tabContent="custom"]'),
      $('.pageSettings .section.themes .tabContainer [tabContent="preset"]'),
      250
    );
  } else {
    setCustomTheme(true);
    applyCustomThemeColors();
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
  setCustomTheme(true, true);
  let $colorVar = $(e.currentTarget).attr("id");
  let $pickedColor = $(e.currentTarget).val();

  document.documentElement.style.setProperty($colorVar, $pickedColor);
  $("#" + $colorVar).attr("value", $pickedColor);
  $("[for=" + $colorVar + "]").text($pickedColor);
});

$(".pageSettings .saveCustomThemeButton").click((e) => {
  let save = [];
  $.each(
    $(".pageSettings .section.customTheme [type='color']"),
    (index, element) => {
      save.push($(element).attr("value"));
    }
  );
  setCustomThemeColors(save);
  showNotification("Custom theme colors saved", 1000);
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
