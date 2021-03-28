//test timer

//ui
let verifyUserWhenLoggedIn = null;

///

// let CustomText = "The quick brown fox jumps over the lazy dog".split(" ");
// let CustomText.isWordRandom = false;
// let CustomText.word = 1;

function getuid() {
  console.error("Only share this uid with Miodec and nobody else!");
  console.log(firebase.auth().currentUser.uid);
  console.error("Only share this uid with Miodec and nobody else!");
}

function emulateLayout(event) {
  function emulatedLayoutShouldShiftKey(event, newKeyPreview) {
    if (Config.capsLockBackspace) return event.shiftKey;
    const isCapsLockHeld = event.originalEvent.getModifierState("CapsLock");
    if (isCapsLockHeld)
      return Misc.isASCIILetter(newKeyPreview) !== event.shiftKey;
    return event.shiftKey;
  }

  function replaceEventKey(event, keyCode) {
    const newKey = String.fromCharCode(keyCode);
    event.keyCode = keyCode;
    event.charCode = keyCode;
    event.which = keyCode;
    event.key = newKey;
    event.code = "Key" + newKey.toUpperCase();
  }

  let newEvent = event;

  try {
    if (Config.layout === "default") {
      //override the caps lock modifier for the default layout if needed
      if (Config.capsLockBackspace && Misc.isASCIILetter(newEvent.key)) {
        replaceEventKey(
          newEvent,
          newEvent.shiftKey
            ? newEvent.key.toUpperCase().charCodeAt(0)
            : newEvent.key.toLowerCase().charCodeAt(0)
        );
      }
      return newEvent;
    }
    const keyEventCodes = [
      "Backquote",
      "Digit1",
      "Digit2",
      "Digit3",
      "Digit4",
      "Digit5",
      "Digit6",
      "Digit7",
      "Digit8",
      "Digit9",
      "Digit0",
      "Minus",
      "Equal",
      "KeyQ",
      "KeyW",
      "KeyE",
      "KeyR",
      "KeyT",
      "KeyY",
      "KeyU",
      "KeyI",
      "KeyO",
      "KeyP",
      "BracketLeft",
      "BracketRight",
      "Backslash",
      "KeyA",
      "KeyS",
      "KeyD",
      "KeyF",
      "KeyG",
      "KeyH",
      "KeyJ",
      "KeyK",
      "KeyL",
      "Semicolon",
      "Quote",
      "IntlBackslash",
      "KeyZ",
      "KeyX",
      "KeyC",
      "KeyV",
      "KeyB",
      "KeyN",
      "KeyM",
      "Comma",
      "Period",
      "Slash",
      "Space",
    ];
    const layoutMap = layouts[Config.layout].keys;

    let mapIndex;
    for (let i = 0; i < keyEventCodes.length; i++) {
      if (newEvent.code == keyEventCodes[i]) {
        mapIndex = i;
      }
    }
    const newKeyPreview = layoutMap[mapIndex][0];
    const shift = emulatedLayoutShouldShiftKey(newEvent, newKeyPreview) ? 1 : 0;
    const newKey = layoutMap[mapIndex][shift];
    replaceEventKey(newEvent, newKey.charCodeAt(0));
  } catch (e) {
    return event;
  }
  return newEvent;
}

(function (history) {
  var pushState = history.pushState;
  history.pushState = function (state) {
    if (Funbox.active === "memory" && state !== "/") {
      Funbox.resetMemoryTimer();
    }
    return pushState.apply(history, arguments);
  };
})(window.history);

function highlightBadWord(index, showError) {
  if (!showError) return;
  $($("#words .word")[index]).addClass("error");
}

function startTest() {
  if (UI.pageTransition) {
    return false;
  }
  if (!Config.dbConfigLoaded) {
    UpdateConfig.setChangedBeforeDb(true);
  }
  try {
    if (firebase.auth().currentUser != null) {
      firebase.analytics().logEvent("testStarted");
    } else {
      firebase.analytics().logEvent("testStartedNoLogin");
    }
  } catch (e) {
    console.log("Analytics unavailable");
  }
  TestLogic.setActive(true);
  TestStats.resetKeypressTimings();
  TimerProgress.restart();
  TimerProgress.show();
  $("#liveWpm").text("0");
  LiveWpm.show();
  LiveAcc.show();
  TimerProgress.update(TestTimer.time);
  TestTimer.clear();

  if (Funbox.active === "memory") {
    Funbox.resetMemoryTimer();
    $("#wordsWrapper").addClass("hidden");
  }

  try {
    if (Config.paceCaret !== "off") PaceCaret.start();
  } catch (e) {}
  //use a recursive self-adjusting timer to avoid time drift
  TestStats.setStart(performance.now());
  TestTimer.start();
  return true;
}

function changePage(page) {
  if (UI.pageTransition) {
    return;
  }
  let activePage = $(".page.active");
  $(".page").removeClass("active");
  $("#wordsInput").focusout();
  if (page == "test" || page == "") {
    UI.setPageTransition(true);
    UI.swapElements(activePage, $(".page.pageTest"), 250, () => {
      UI.setPageTransition(false);
      TestUI.focusWords();
      $(".page.pageTest").addClass("active");
      history.pushState("/", null, "/");
    });
    TestConfig.show();
    hideSignOutButton();
    // restartCount = 0;
    // incompleteTestSeconds = 0;
    TestStats.resetIncomplete();
    ManualRestart.set();
    TestLogic.restart();
  } else if (page == "about") {
    UI.setPageTransition(true);
    TestLogic.restart();
    UI.swapElements(activePage, $(".page.pageAbout"), 250, () => {
      UI.setPageTransition(false);
      history.pushState("about", null, "about");
      $(".page.pageAbout").addClass("active");
    });
    TestConfig.hide();
    hideSignOutButton();
  } else if (page == "settings") {
    UI.setPageTransition(true);
    TestLogic.restart();
    UI.swapElements(activePage, $(".page.pageSettings"), 250, () => {
      UI.setPageTransition(false);
      history.pushState("settings", null, "settings");
      $(".page.pageSettings").addClass("active");
    });
    updateSettingsPage();
    TestConfig.hide();
    hideSignOutButton();
  } else if (page == "account") {
    if (!firebase.auth().currentUser) {
      changePage("login");
    } else {
      UI.setPageTransition(true);
      TestLogic.restart();
      UI.swapElements(activePage, $(".page.pageAccount"), 250, () => {
        UI.setPageTransition(false);
        history.pushState("account", null, "account");
        $(".page.pageAccount").addClass("active");
      });
      refreshAccountPage();
      TestConfig.hide();
      showSignOutButton();
    }
  } else if (page == "login") {
    if (firebase.auth().currentUser != null) {
      changePage("account");
    } else {
      UI.setPageTransition(true);
      TestLogic.restart();
      UI.swapElements(activePage, $(".page.pageLogin"), 250, () => {
        UI.setPageTransition(false);
        history.pushState("login", null, "login");
        $(".page.pageLogin").addClass("active");
      });
      TestConfig.hide();
      hideSignOutButton();
    }
  }
}

function showEditTags(action, id, name) {
  if (action === "add") {
    $("#tagsWrapper #tagsEdit").attr("action", "add");
    $("#tagsWrapper #tagsEdit .title").html("Add new tag");
    $("#tagsWrapper #tagsEdit .button").html(`<i class="fas fa-plus"></i>`);
    $("#tagsWrapper #tagsEdit input").val("");
    $("#tagsWrapper #tagsEdit input").removeClass("hidden");
  } else if (action === "edit") {
    $("#tagsWrapper #tagsEdit").attr("action", "edit");
    $("#tagsWrapper #tagsEdit").attr("tagid", id);
    $("#tagsWrapper #tagsEdit .title").html("Edit tag name");
    $("#tagsWrapper #tagsEdit .button").html(`<i class="fas fa-pen"></i>`);
    $("#tagsWrapper #tagsEdit input").val(name);
    $("#tagsWrapper #tagsEdit input").removeClass("hidden");
  } else if (action === "remove") {
    $("#tagsWrapper #tagsEdit").attr("action", "remove");
    $("#tagsWrapper #tagsEdit").attr("tagid", id);
    $("#tagsWrapper #tagsEdit .title").html("Remove tag " + name);
    $("#tagsWrapper #tagsEdit .button").html(`<i class="fas fa-check"></i>`);
    $("#tagsWrapper #tagsEdit input").addClass("hidden");
  }

  if ($("#tagsWrapper").hasClass("hidden")) {
    $("#tagsWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, () => {
        $("#tagsWrapper #tagsEdit input").focus();
      });
  }
}

function hideEditTags() {
  if (!$("#tagsWrapper").hasClass("hidden")) {
    $("#tagsWrapper #tagsEdit").attr("action", "");
    $("#tagsWrapper #tagsEdit").attr("tagid", "");
    $("#tagsWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#tagsWrapper").addClass("hidden");
        }
      );
  }
}

$("#tagsWrapper").click((e) => {
  if ($(e.target).attr("id") === "tagsWrapper") {
    hideEditTags();
  }
});

$("#tagsWrapper #tagsEdit .button").click(() => {
  tagsEdit();
});

$("#tagsWrapper #tagsEdit input").keypress((e) => {
  if (e.keyCode == 13) {
    tagsEdit();
  }
});

function tagsEdit() {
  let action = $("#tagsWrapper #tagsEdit").attr("action");
  let inputVal = $("#tagsWrapper #tagsEdit input").val();
  let tagid = $("#tagsWrapper #tagsEdit").attr("tagid");
  hideEditTags();
  if (action === "add") {
    Loader.show();
    CloudFunctions.addTag({
      uid: firebase.auth().currentUser.uid,
      name: inputVal,
    }).then((e) => {
      Loader.hide();
      let status = e.data.resultCode;
      if (status === 1) {
        Notifications.add("Tag added", 1, 2);
        DB.getSnapshot().tags.push({
          name: inputVal,
          id: e.data.id,
        });
        updateResultEditTagsPanelButtons();
        updateSettingsPage();
        updateFilterTags();
      } else if (status === -1) {
        Notifications.add("Invalid tag name", 0);
      } else if (status < -1) {
        Notifications.add("Unknown error: " + e.data.message, -1);
      }
    });
  } else if (action === "edit") {
    Loader.show();
    CloudFunctions.editTag({
      uid: firebase.auth().currentUser.uid,
      name: inputVal,
      tagid: tagid,
    }).then((e) => {
      Loader.hide();
      let status = e.data.resultCode;
      if (status === 1) {
        Notifications.add("Tag updated", 1);
        DB.getSnapshot().tags.forEach((tag) => {
          if (tag.id === tagid) {
            tag.name = inputVal;
          }
        });
        updateResultEditTagsPanelButtons();
        updateSettingsPage();
        updateFilterTags();
      } else if (status === -1) {
        Notifications.add("Invalid tag name", 0);
      } else if (status < -1) {
        Notifications.add("Unknown error: " + e.data.message, -1);
      }
    });
  } else if (action === "remove") {
    Loader.show();
    CloudFunctions.removeTag({
      uid: firebase.auth().currentUser.uid,
      tagid: tagid,
    }).then((e) => {
      Loader.hide();
      let status = e.data.resultCode;
      if (status === 1) {
        Notifications.add("Tag removed", 1);
        DB.getSnapshot().tags.forEach((tag, index) => {
          if (tag.id === tagid) {
            DB.getSnapshot().tags.splice(index, 1);
          }
        });
        updateResultEditTagsPanelButtons();
        updateSettingsPage();
        updateFilterTags();
      } else if (status < -1) {
        Notifications.add("Unknown error: " + e.data.message, -1);
      }
    });
  }
}

$(document).on("click", "#top .logo", (e) => {
  changePage("test");
});

$("#wordsWrapper").on("click", () => {
  TestUI.focusWords();
});

$(document).on("click", "#top #menu .icon-button", (e) => {
  if ($(e.currentTarget).hasClass("discord")) return;
  if ($(e.currentTarget).hasClass("leaderboards")) {
    Leaderboards.show();
  } else {
    const href = $(e.currentTarget).attr("href");
    ManualRestart.set();
    changePage(href.replace("/", ""));
  }
});

$(window).on("popstate", (e) => {
  let state = e.originalEvent.state;
  if (state == "" || state == "/") {
    // show test
    changePage("test");
  } else if (state == "about") {
    // show about
    changePage("about");
  } else if (state == "account" || state == "login") {
    if (firebase.auth().currentUser) {
      changePage("account");
    } else {
      changePage("login");
    }
  }
});

$(document).on("keypress", "#restartTestButton", (event) => {
  if (event.keyCode == 13) {
    if (
      TestLogic.active &&
      Config.repeatQuotes === "typing" &&
      Config.mode === "quote"
    ) {
      TestLogic.restart(true);
    } else {
      TestLogic.restart();
    }
  }
});

$(document.body).on("click", "#restartTestButton", () => {
  ManualRestart.set();
  if (TestUI.resultCalculating) return;
  if (
    TestLogic.active &&
    Config.repeatQuotes === "typing" &&
    Config.mode === "quote"
  ) {
    TestLogic.restart(true);
  } else {
    TestLogic.restart();
  }
});

$(document).on("keypress", "#practiseMissedWordsButton", (event) => {
  if (event.keyCode == 13) {
    PractiseMissed.init();
  }
});

$(document.body).on("click", "#practiseMissedWordsButton", () => {
  PractiseMissed.init();
});

$(document).on("keypress", "#nextTestButton", (event) => {
  if (event.keyCode == 13) {
    TestLogic.restart();
  }
});

$(document.body).on("click", "#nextTestButton", () => {
  ManualRestart.set();
  TestLogic.restart();
});

$(document).on("keypress", "#showWordHistoryButton", (event) => {
  if (event.keyCode == 13) {
    TestUI.toggleResultWords();
  }
});

$(document.body).on("click", "#showWordHistoryButton", () => {
  TestUI.toggleResultWords();
});

$(document.body).on("click", "#restartTestButtonWithSameWordset", () => {
  if (Config.mode == "zen") {
    Notifications.add("Repeat test disabled in zen mode");
    return;
  }
  ManualRestart.set();
  TestLogic.restart(true);
});

$(document).on("keypress", "#restartTestButtonWithSameWordset", (event) => {
  if (Config.mode == "zen") {
    Notifications.add("Repeat test disabled in zen mode");
    return;
  }
  if (event.keyCode == 13) {
    TestLogic.restart(true);
  }
});

$(document.body).on("click", ".version", () => {
  $("#versionHistoryWrapper")
    .css("opacity", 0)
    .removeClass("hidden")
    .animate({ opacity: 1 }, 125);
});

$(document.body).on("click", "#versionHistoryWrapper", () => {
  $("#versionHistoryWrapper")
    .css("opacity", 1)
    .animate({ opacity: 0 }, 125, () => {
      $("#versionHistoryWrapper").addClass("hidden");
    });
});

$(document.body).on("click", "#supportMeButton", () => {
  $("#supportMeWrapper")
    .css("opacity", 0)
    .removeClass("hidden")
    .animate({ opacity: 1 }, 125);
});

$(document.body).on("click", "#supportMeWrapper", () => {
  $("#supportMeWrapper")
    .css("opacity", 1)
    .animate({ opacity: 0 }, 125, () => {
      $("#supportMeWrapper").addClass("hidden");
    });
});

$(document.body).on("click", "#supportMeWrapper .button.ads", () => {
  CommandlineLists.pushCurrent(CommandlineLists.commandsEnableAds);
  Commandline.show();
  $("#supportMeWrapper")
    .css("opacity", 1)
    .animate({ opacity: 0 }, 125, () => {
      $("#supportMeWrapper").addClass("hidden");
    });
});

$(document.body).on("click", "#supportMeWrapper a.button", () => {
  $("#supportMeWrapper")
    .css("opacity", 1)
    .animate({ opacity: 0 }, 125, () => {
      $("#supportMeWrapper").addClass("hidden");
    });
});

$(document.body).on("click", ".pageAbout .aboutEnableAds", () => {
  CommandlineLists.pushCurrent(CommandlineLists.commandsEnableAds);
  Commandline.show();
});

$("#wordsInput").keypress((event) => {
  event.preventDefault();
});

$("#wordsInput").on("focus", () => {
  if (!TestUI.resultVisible && Config.showOutOfFocusWarning) {
    OutOfFocus.hide();
  }
  Caret.show(TestLogic.input.current);
});

$("#wordsInput").on("focusout", () => {
  if (!TestUI.resultVisible && Config.showOutOfFocusWarning) {
    OutOfFocus.show();
  }
  Caret.hide();
});

$(window).resize(() => {
  Caret.updatePosition();
});

$(document).mousemove(function (event) {
  if (
    $("#top").hasClass("focus") &&
    (event.originalEvent.movementX > 0 || event.originalEvent.movementY > 0)
  ) {
    Focus.set(false);
  }
});

$(document).on("click", "#testModesNotice .text-button", (event) => {
  // console.log("CommandlineLists."+$(event.currentTarget).attr("commands"));
  let commands = CommandlineLists.getList(
    $(event.currentTarget).attr("commands")
  );
  let func = $(event.currentTarget).attr("function");
  if (commands !== undefined) {
    if ($(event.currentTarget).attr("commands") === "commandsTags") {
      CommandlineLists.updateTagCommands();
    }
    CommandlineLists.pushCurrent(commands);
    Commandline.show();
  } else if (func != undefined) {
    eval(func);
  }
});

$(document).on("click", "#commandLineMobileButton", () => {
  CommandlineLists.setCurrent(CommandlineLists.defaultCommands);
  Commandline.show();
});

let dontInsertSpace = false;

$(document).keyup((event) => {
  if (!event.originalEvent.isTrusted) return;

  if (TestUI.resultVisible) return;
  let now = performance.now();
  let diff = Math.abs(TestStats.keypressTimings.duration.current - now);
  if (TestStats.keypressTimings.duration.current !== -1) {
    TestStats.pushKeypressDuration(diff);
    // keypressStats.duration.array.push(diff);
  }
  TestStats.setKeypressDuration(now);
  // keypressStats.duration.current = now;
  Monkey.stop();
});

$(document).keydown(function (event) {
  if (!(event.key == " ") && !event.originalEvent.isTrusted) return;

  if (!TestUI.resultVisible) {
    TestStats.recordKeypressSpacing();
  }

  Monkey.type();

  //autofocus
  let pageTestActive = !$(".pageTest").hasClass("hidden");
  let commandLineVisible = !$("#commandLineWrapper").hasClass("hidden");
  let wordsFocused = $("#wordsInput").is(":focus");
  let modePopupVisible =
    !$("#customTextPopupWrapper").hasClass("hidden") ||
    !$("#customWordAmountPopupWrapper").hasClass("hidden") ||
    !$("#customTestDurationPopupWrapper").hasClass("hidden") ||
    !$("#quoteSearchPopupWrapper").hasClass("hidden");
  if (
    pageTestActive &&
    !commandLineVisible &&
    !modePopupVisible &&
    !TestUI.resultVisible &&
    !wordsFocused &&
    event.key !== "Enter"
  ) {
    TestUI.focusWords();
    wordsFocused = true;
    // if (Config.showOutOfFocusWarning) return;
  }

  //tab
  if (
    (event.key == "Tab" && !Config.swapEscAndTab) ||
    (event.key == "Escape" && Config.swapEscAndTab)
  ) {
    handleTab(event);
    // event.preventDefault();
  }

  //blocking firefox from going back in history with backspace
  if (event.key === "Backspace" && wordsFocused) {
    let t = /INPUT|SELECT|TEXTAREA/i;
    if (
      !t.test(event.target.tagName) ||
      event.target.disabled ||
      event.target.readOnly
    ) {
      event.preventDefault();
    }
  }

  // keypressStats.duration.current = performance.now();
  TestStats.setKeypressDuration(performance.now());

  if (TestUI.testRestarting) {
    return;
  }

  //backspace
  const isBackspace =
    event.key === "Backspace" ||
    (Config.capsLockBackspace && event.key === "CapsLock");
  if (isBackspace && wordsFocused) {
    handleBackspace(event);
  }

  if (event.key === "Enter" && Funbox.active === "58008" && wordsFocused) {
    event.key = " ";
  }

  //space or enter
  if (event.key === " " && wordsFocused) {
    handleSpace(event, false);
  }

  if (wordsFocused && !commandLineVisible) {
    handleAlpha(event);
  }

  let acc = Misc.roundTo2(TestStats.calculateAccuracy());
  LiveAcc.update(acc);
});

function handleTab(event) {
  if (TestUI.resultCalculating) {
    event.preventDefault();
  }
  if ($("#customTextPopup .textarea").is(":focus")) {
    event.preventDefault();

    let area = $("#customTextPopup .textarea")[0];

    var start = area.selectionStart;
    var end = area.selectionEnd;

    // set textarea value to: text before caret + tab + text after caret
    area.value =
      area.value.substring(0, start) + "\t" + area.value.substring(end);

    // put caret at right position again
    area.selectionStart = area.selectionEnd = start + 1;

    // event.preventDefault();
    // $("#customTextPopup .textarea").val(
    //   $("#customTextPopup .textarea").val() + "\t"
    // );
    return;
  } else if (
    $(".pageTest").hasClass("active") &&
    !TestUI.resultCalculating &&
    $("#commandLineWrapper").hasClass("hidden") &&
    $("#simplePopupWrapper").hasClass("hidden")
  ) {
    if (Config.quickTab) {
      if (Config.mode == "zen" && !event.shiftKey) {
        //ignore
      } else {
        if (event.shiftKey) ManualRestart.set();

        if (
          TestLogic.active &&
          Config.repeatQuotes === "typing" &&
          Config.mode === "quote"
        ) {
          TestLogic.restart(true, false, event);
        } else {
          TestLogic.restart(false, false, event);
        }
      }
    } else {
      if (
        !TestUI.resultVisible &&
        ((TestLogic.hasTab && event.shiftKey) ||
          (!TestLogic.hasTab && Config.mode !== "zen") ||
          (Config.mode === "zen" && event.shiftKey))
      ) {
        event.preventDefault();
        $("#restartTestButton").focus();
      }
    }
  } else if (Config.quickTab) {
    changePage("test");
  }

  // } else if (
  //   !event.ctrlKey &&
  //   (
  //     (!event.shiftKey && !TestLogic.hasTab) ||
  //     (event.shiftKey && TestLogic.hasTab) ||
  //     TestUI.resultVisible
  //   ) &&
  //   Config.quickTab &&
  //   !$(".pageLogin").hasClass("active") &&
  //   !resultCalculating &&
  //   $("#commandLineWrapper").hasClass("hidden") &&
  //   $("#simplePopupWrapper").hasClass("hidden")
  // ) {
  //   event.preventDefault();
  //   if ($(".pageTest").hasClass("active")) {
  //     if (
  //       (Config.mode === "words" && Config.words < 1000) ||
  //       (Config.mode === "time" && Config.time < 3600) ||
  //       Config.mode === "quote" ||
  //       (Config.mode === "custom" &&
  //         CustomText.isWordRandom &&
  //         CustomText.word < 1000) ||
  //       (Config.mode === "custom" &&
  //         CustomText.isTimeRandom &&
  //         CustomText.time < 3600) ||
  //       (Config.mode === "custom" &&
  //         !CustomText.isWordRandom &&
  //         CustomText.text.length < 1000)
  //     ) {
  //       if (TestLogic.active) {
  //         let testNow = performance.now();
  //         let testSeconds = Misc.roundTo2((testNow - testStart) / 1000);
  //         let afkseconds = keypressPerSecond.filter(
  //           (x) => x.count == 0 && x.mod == 0
  //         ).length;
  //         incompleteTestSeconds += testSeconds - afkseconds;
  //         restartCount++;
  //       }
  //       TestLogic.restart();
  //     } else {
  //       Notifications.add("Quick restart disabled for long tests", 0);
  //     }
  //   } else {
  //     changePage("test");
  //   }
  // } else if (
  //   !Config.quickTab &&
  //   TestLogic.hasTab &&
  //   event.shiftKey &&
  //   !TestUI.resultVisible
  // ) {
  //   event.preventDefault();
  //   $("#restartTestButton").focus();
  // }
}

function handleBackspace(event) {
  event.preventDefault();
  if (!TestLogic.active) return;
  if (
    TestLogic.input.current == "" &&
    TestLogic.input.history.length > 0 &&
    TestUI.currentWordElementIndex > 0
  ) {
    //if nothing is inputted and its not the first word
    if (
      (TestLogic.input.getHistory(TestLogic.words.currentIndex - 1) ==
        TestLogic.words.get(TestLogic.words.currentIndex - 1) &&
        !Config.freedomMode) ||
      $($(".word")[TestLogic.words.currentIndex - 1]).hasClass("hidden")
    ) {
      return;
    } else {
      if (Config.confidenceMode === "on" || Config.confidenceMode === "max")
        return;
      if (event["ctrlKey"] || event["altKey"]) {
        TestLogic.input.resetCurrent();
        TestLogic.input.popHistory();
        TestLogic.corrected.popHistory();
      } else {
        TestLogic.input.setCurrent(TestLogic.input.popHistory());
        TestLogic.corrected.setCurrent(TestLogic.corrected.popHistory());
        if (Funbox.active === "nospace") {
          TestLogic.input.setCurrent(
            TestLogic.input.current.substring(
              0,
              TestLogic.input.current.length - 1
            )
          );
        }
      }
      TestLogic.words.decreaseCurrentIndex();
      TestUI.setCurrentWordElementIndex(TestUI.currentWordElementIndex - 1);
      TestUI.updateActiveElement(true);
      Funbox.toggleScript(TestLogic.words.getCurrent());
      TestUI.updateWordElement(!Config.blindMode);
    }
  } else {
    if (Config.confidenceMode === "max") return;
    if (event["ctrlKey"] || event["altKey"]) {
      let limiter = " ";
      if (
        TestLogic.input.current.lastIndexOf("-") >
        TestLogic.input.current.lastIndexOf(" ")
      )
        limiter = "-";

      let split = TestLogic.input.current.replace(/ +/g, " ").split(limiter);
      if (split[split.length - 1] == "") {
        split.pop();
      }
      let addlimiter = false;
      if (split.length > 1) {
        addlimiter = true;
      }
      split.pop();
      TestLogic.input.setCurrent(split.join(limiter));

      if (addlimiter) {
        TestLogic.input.appendCurrent(limiter);
      }
    } else if (event.metaKey) {
      TestLogic.input.resetCurrent();
    } else {
      TestLogic.input.setCurrent(
        TestLogic.input.current.substring(0, TestLogic.input.current.length - 1)
      );
    }
    TestUI.updateWordElement(!Config.blindMode);
  }
  Sound.playClick(Config.playSoundOnClick);
  if (Config.keymapMode === "react") {
    Keymap.flashKey(event.code, true);
  } else if (Config.keymapMode === "next" && Config.mode !== "zen") {
    Keymap.highlightKey(
      TestLogic.words
        .getCurrent()
        .substring(
          TestLogic.input.current.length,
          TestLogic.input.current.length + 1
        )
        .toString()
        .toUpperCase()
    );
  }
  Caret.updatePosition();
}

function handleSpace(event, isEnter) {
  if (!TestLogic.active) return;
  if (TestLogic.input.current === "") return;
  // let nextWord = wordsList[TestLogic.words.currentIndex + 1];
  // if ((isEnter && nextWord !== "\n") && (isEnter && Funbox.active !== "58008")) return;
  // if (!isEnter && nextWord === "\n") return;
  event.preventDefault();

  if (Config.mode == "zen") {
    $("#words .word.active").removeClass("active");
    $("#words").append("<div class='word active'></div>");
  }

  let currentWord = TestLogic.words.getCurrent();
  if (Funbox.active === "layoutfluid" && Config.mode !== "time") {
    const layouts = ["qwerty", "dvorak", "colemak"];
    let index = 0;
    let outof = TestLogic.words.length;
    index = Math.floor((TestLogic.input.history.length + 1) / (outof / 3));
    if (Config.layout !== layouts[index] && layouts[index] !== undefined) {
      Notifications.add(`--- !!! ${layouts[index]} !!! ---`, 0);
    }
    UpdateConfig.setLayout(layouts[index]);
    UpdateConfig.setKeymapLayout(layouts[index]);
    Keymap.highlightKey(
      TestLogic.words
        .getCurrent()
        .substring(
          TestLogic.input.current.length,
          TestLogic.input.current.length + 1
        )
        .toString()
        .toUpperCase()
    );
    settingsGroups.layout.updateButton();
  }
  dontInsertSpace = true;
  if (currentWord == TestLogic.input.current || Config.mode == "zen") {
    //correct word or in zen mode
    PaceCaret.handleSpace(true, currentWord);
    TestStats.incrementAccuracy(true);
    TestLogic.input.pushHistory();
    TestLogic.words.increaseCurrentIndex();
    TestUI.setCurrentWordElementIndex(TestUI.currentWordElementIndex + 1);
    TestUI.updateActiveElement();
    Funbox.toggleScript(TestLogic.words.getCurrent());
    Caret.updatePosition();
    TestStats.incrementKeypressCount();
    TestStats.pushKeypressWord(TestLogic.words.currentIndex);
    // currentKeypress.count++;
    // currentKeypress.words.push(TestLogic.words.currentIndex);
    if (Funbox.active !== "nospace") {
      Sound.playClick(Config.playSoundOnClick);
    }
  } else {
    //incorrect word
    PaceCaret.handleSpace(false, currentWord);
    if (Funbox.active !== "nospace") {
      if (!Config.playSoundOnError || Config.blindMode) {
        Sound.playClick(Config.playSoundOnClick);
      } else {
        Sound.playError(Config.playSoundOnError);
      }
    }
    TestStats.incrementAccuracy(false);
    TestStats.incrementKeypressErrors();
    let cil = TestLogic.input.current.length;
    if (cil <= TestLogic.words.getCurrent().length) {
      if (cil >= TestLogic.corrected.current.length) {
        TestLogic.corrected.appendCurrent("_");
      } else {
        TestLogic.corrected.setCurrent(
          TestLogic.corrected.current.substring(0, cil) +
            "_" +
            TestLogic.corrected.current.substring(cil + 1)
        );
      }
    }
    if (Config.stopOnError != "off") {
      if (Config.difficulty == "expert" || Config.difficulty == "master") {
        //failed due to diff when pressing space
        TestLogic.fail();
        return;
      }
      if (Config.stopOnError == "word") {
        TestLogic.input.appendCurrent(" ");
        TestUI.updateWordElement(true);
        Caret.updatePosition();
      }
      return;
    }
    if (Config.blindMode) $("#words .word.active letter").addClass("correct");
    TestLogic.input.pushHistory();
    highlightBadWord(TestUI.currentWordElementIndex, !Config.blindMode);
    TestLogic.words.increaseCurrentIndex();
    TestUI.setCurrentWordElementIndex(TestUI.currentWordElementIndex + 1);
    TestUI.updateActiveElement();
    Funbox.toggleScript(TestLogic.words.getCurrent());
    Caret.updatePosition();
    // currentKeypress.count++;
    // currentKeypress.words.push(TestLogic.words.currentIndex);
    TestStats.incrementKeypressCount();
    TestStats.pushKeypressWord(TestLogic.words.currentIndex);
    if (Config.difficulty == "expert" || Config.difficulty == "master") {
      TestLogic.fail();
      return;
    } else if (TestLogic.words.currentIndex == TestLogic.words.length) {
      //submitted last word that is incorrect
      TestStats.setLastSecondNotRound();
      TestLogic.finish();
      return;
    }
  }

  TestLogic.corrected.pushHistory();

  if (
    !Config.showAllLines ||
    Config.mode == "time" ||
    (CustomText.isWordRandom && CustomText.word == 0) ||
    CustomText.isTimeRandom
  ) {
    let currentTop = Math.floor(
      document.querySelectorAll("#words .word")[
        TestUI.currentWordElementIndex - 1
      ].offsetTop
    );
    let nextTop;
    try {
      nextTop = Math.floor(
        document.querySelectorAll("#words .word")[
          TestUI.currentWordElementIndex
        ].offsetTop
      );
    } catch (e) {
      nextTop = 0;
    }

    if (nextTop > currentTop && !TestUI.lineTransition) {
      TestUI.lineJump(currentTop);
    }
  } //end of line wrap

  Caret.updatePosition();

  if (Config.keymapMode === "react") {
    Keymap.flashKey(event.code, true);
  } else if (Config.keymapMode === "next" && Config.mode !== "zen") {
    Keymap.highlightKey(
      TestLogic.words
        .getCurrent()
        .substring(
          TestLogic.input.current.length,
          TestLogic.input.current.length + 1
        )
        .toString()
        .toUpperCase()
    );
  }
  if (
    Config.mode === "words" ||
    Config.mode === "custom" ||
    Config.mode === "quote" ||
    Config.mode === "zen"
  ) {
    TimerProgress.update(TestTimer.time);
  }
  if (
    Config.mode == "time" ||
    Config.mode == "words" ||
    Config.mode == "custom"
  ) {
    TestLogic.addWord();
  }
}

function handleAlpha(event) {
  if (
    [
      "ContextMenu",
      "Escape",
      "Shift",
      "Control",
      "Meta",
      "Alt",
      "AltGraph",
      "CapsLock",
      "Backspace",
      "PageUp",
      "PageDown",
      "Home",
      "ArrowUp",
      "ArrowLeft",
      "ArrowRight",
      "ArrowDown",
      "OS",
      "Insert",
      "Home",
      "Undefined",
      "Control",
      "Fn",
      "FnLock",
      "Hyper",
      "NumLock",
      "ScrollLock",
      "Symbol",
      "SymbolLock",
      "Super",
      "Unidentified",
      "Process",
      "Delete",
      "KanjiMode",
      "Pause",
      "PrintScreen",
      "Clear",
      "End",
      undefined,
    ].includes(event.key)
  ) {
    TestStats.incrementKeypressMod();
    // currentKeypress.mod++;
    return;
  }

  //insert space for expert and master or strict space,
  //otherwise dont do anything
  if (event.key === " ") {
    if (Config.difficulty !== "normal" || Config.strictSpace) {
      if (dontInsertSpace) {
        dontInsertSpace = false;
        return;
      }
    } else {
      return;
    }
  }

  if (event.key === "Tab") {
    if (
      Config.mode !== "zen" &&
      (!TestLogic.hasTab || (TestLogic.hasTab && event.shiftKey))
    ) {
      return;
    }
    event.key = "\t";
    event.preventDefault();
  }

  if (event.key === "Enter") {
    if (event.shiftKey && Config.mode == "zen") {
      TestLogic.finish();
    }
    if (
      event.shiftKey &&
      ((Config.mode == "time" && Config.time === 0) ||
        (Config.mode == "words" && Config.words === 0))
    ) {
      TestLogic.setBailout(true);
      TestLogic.finish();
    }
    event.key = "\n";
  }

  // if (event.key.length > 1) return;
  if (/F\d+/.test(event.key)) return;
  if (/Numpad/.test(event.key)) return;
  if (/Volume/.test(event.key)) return;
  if (/Media/.test(event.key)) return;
  if (
    event.ctrlKey != event.altKey &&
    (event.ctrlKey || /Linux/.test(window.navigator.platform))
  )
    return;
  if (event.metaKey) return;

  let originalEvent = event;

  event = emulateLayout(event);

  //start the test
  if (
    TestLogic.input.current == "" &&
    TestLogic.input.history.length == 0 &&
    !TestLogic.active
  ) {
    if (!startTest()) return;
  } else {
    if (!TestLogic.active) return;
  }

  Focus.set(true);
  Caret.stopAnimation();

  //show dead keys
  if (event.key === "Dead") {
    Sound.playClick(Config.playSoundOnClick);
    $(
      document.querySelector("#words .word.active").querySelectorAll("letter")[
        TestLogic.input.current.length
      ]
    ).toggleClass("dead");
    return;
  }

  //check if the char typed was correct
  let thisCharCorrect;
  let nextCharInWord;
  if (Config.mode != "zen") {
    nextCharInWord = TestLogic.words
      .getCurrent()
      .substring(
        TestLogic.input.current.length,
        TestLogic.input.current.length + 1
      );
  }

  if (nextCharInWord == event["key"]) {
    thisCharCorrect = true;
  } else {
    thisCharCorrect = false;
  }

  if (Config.language.split("_")[0] == "russian") {
    if ((event.key === "е" || event.key === "e") && nextCharInWord == "ё") {
      event.key = nextCharInWord;
      thisCharCorrect = true;
    }
    if (
      event.key === "ё" &&
      (nextCharInWord == "е" || nextCharInWord === "e")
    ) {
      event.key = nextCharInWord;
      thisCharCorrect = true;
    }
  }

  if (Config.mode == "zen") {
    thisCharCorrect = true;
  }

  if (event.key === "’" && nextCharInWord == "'") {
    event.key = "'";
    thisCharCorrect = true;
  }

  if (event.key === "'" && nextCharInWord == "’") {
    event.key = "’";
    thisCharCorrect = true;
  }

  if (event.key === "”" && nextCharInWord == '"') {
    event.key = '"';
    thisCharCorrect = true;
  }

  if (event.key === '"' && nextCharInWord == "”") {
    event.key = "”";
    thisCharCorrect = true;
  }

  if ((event.key === "–" || event.key === "—") && nextCharInWord == "-") {
    event.key = "-";
    thisCharCorrect = true;
  }

  if (
    Config.oppositeShiftMode === "on" &&
    ShiftTracker.isUsingOppositeShift(originalEvent) === false
  ) {
    thisCharCorrect = false;
  }

  if (!thisCharCorrect) {
    TestStats.incrementAccuracy(false);
    TestStats.incrementKeypressErrors();
    // currentError.count++;
    // currentError.words.push(TestLogic.words.currentIndex);
    thisCharCorrect = false;
    TestStats.pushMissedWord(TestLogic.words.getCurrent());
  } else {
    TestStats.incrementAccuracy(true);
    thisCharCorrect = true;
    if (Config.mode == "zen") {
      //making the input visible to the user
      $("#words .active").append(
        `<letter class="correct">${event.key}</letter>`
      );
    }
  }

  if (thisCharCorrect) {
    Sound.playClick(Config.playSoundOnClick);
  } else {
    if (!Config.playSoundOnError || Config.blindMode) {
      Sound.playClick(Config.playSoundOnClick);
    } else {
      Sound.playError(Config.playSoundOnError);
    }
  }

  if (
    Config.oppositeShiftMode === "on" &&
    ShiftTracker.isUsingOppositeShift(originalEvent) === false
  )
    return;

  //update current corrected verison. if its empty then add the current key. if its not then replace the last character with the currently pressed one / add it
  if (TestLogic.corrected.current === "") {
    TestLogic.corrected.setCurrent(TestLogic.input.current + event["key"]);
  } else {
    let cil = TestLogic.input.current.length;
    if (cil >= TestLogic.corrected.current.length) {
      TestLogic.corrected.appendCurrent(event["key"]);
    } else if (!thisCharCorrect) {
      TestLogic.corrected.setCurrent(
        TestLogic.corrected.current.substring(0, cil) +
          event["key"] +
          TestLogic.corrected.current.substring(cil + 1)
      );
    }
  }
  TestStats.incrementKeypressCount();
  TestStats.pushKeypressWord(TestLogic.words.currentIndex);
  // currentKeypress.count++;
  // currentKeypress.words.push(TestLogic.words.currentIndex);

  if (Config.stopOnError == "letter" && !thisCharCorrect) {
    return;
  }

  //update the active word top, but only once
  if (
    TestLogic.input.current.length === 1 &&
    TestLogic.words.currentIndex === 0
  ) {
    TestUI.setActiveWordTop(document.querySelector("#words .active").offsetTop);
  }

  //max length of the input is 20 unless in zen mode
  if (
    Config.mode == "zen" ||
    TestLogic.input.current.length < TestLogic.words.getCurrent().length + 20
  ) {
    TestLogic.input.appendCurrent(event["key"]);
  }

  if (!thisCharCorrect && Config.difficulty == "master") {
    TestLogic.fail();
    return;
  }

  //keymap
  if (Config.keymapMode === "react") {
    Keymap.flashKey(event.key, thisCharCorrect);
  } else if (Config.keymapMode === "next" && Config.mode !== "zen") {
    Keymap.highlightKey(
      TestLogic.words
        .getCurrent()
        .substring(
          TestLogic.input.current.length,
          TestLogic.input.current.length + 1
        )
        .toString()
        .toUpperCase()
    );
  }

  let activeWordTopBeforeJump = TestUI.activeWordTop;
  TestUI.updateWordElement(!Config.blindMode);

  if (Config.mode != "zen") {
    //not applicable to zen mode
    //auto stop the test if the last word is correct
    let currentWord = TestLogic.words.getCurrent();
    let lastindex = TestLogic.words.currentIndex;
    if (
      (currentWord == TestLogic.input.current ||
        (Config.quickEnd &&
          currentWord.length == TestLogic.input.current.length &&
          Config.stopOnError == "off")) &&
      lastindex == TestLogic.words.length - 1
    ) {
      TestLogic.input.pushHistory();

      TestLogic.corrected.pushHistory();
      TestStats.setLastSecondNotRound();
      TestLogic.finish();
    }
  }

  //simulate space press in nospace funbox
  if (
    (Funbox.active === "nospace" &&
      TestLogic.input.current.length === TestLogic.words.getCurrent().length) ||
    (event.key === "\n" && thisCharCorrect)
  ) {
    $.event.trigger({
      type: "keydown",
      which: " ".charCodeAt(0),
      key: " ",
    });
  }

  let newActiveTop = document.querySelector("#words .word.active").offsetTop;
  //stop the word jump by slicing off the last character, update word again
  if (
    activeWordTopBeforeJump < newActiveTop &&
    !TestUI.lineTransition &&
    TestLogic.input.current.length > 1
  ) {
    if (Config.mode == "zen") {
      let currentTop = Math.floor(
        document.querySelectorAll("#words .word")[
          TestUI.currentWordElementIndex - 1
        ].offsetTop
      );
      if (!Config.showAllLines) TestUI.lineJump(currentTop);
    } else {
      TestLogic.input.setCurrent(TestLogic.input.current.slice(0, -1));
      TestUI.updateWordElement(!Config.blindMode);
    }
  }

  Caret.updatePosition();
}

window.addEventListener("beforeunload", (event) => {
  // Cancel the event as stated by the standard.
  if (
    (Config.mode === "words" && Config.words < 1000) ||
    (Config.mode === "time" && Config.time < 3600) ||
    Config.mode === "quote" ||
    (Config.mode === "custom" &&
      CustomText.isWordRandom &&
      CustomText.word < 1000) ||
    (Config.mode === "custom" &&
      CustomText.isTimeRandom &&
      CustomText.time < 1000) ||
    (Config.mode === "custom" &&
      !CustomText.isWordRandom &&
      CustomText.text.length < 1000)
  ) {
    //ignore
  } else {
    if (TestLogic.active) {
      event.preventDefault();
      // Chrome requires returnValue to be set.
      event.returnValue = "";
    }
  }
});

if (firebase.app().options.projectId === "monkey-type-dev-67af4") {
  $("#top .logo .bottom").text("monkey-dev");
  $("head title").text("Monkey Dev");
  $("body").append(
    `<div class="devIndicator tr">DEV</div><div class="devIndicator bl">DEV</div>`
  );
}

if (window.location.hostname === "localhost") {
  window.onerror = function (error) {
    Notifications.add(error, -1);
  };
  $("#top .logo .top").text("localhost");
  $("head title").text($("head title").text() + " (localhost)");
  firebase.functions().useFunctionsEmulator("http://localhost:5001");
  $("body").append(
    `<div class="devIndicator tl">local</div><div class="devIndicator br">local</div>`
  );
}

ManualRestart.set();

let configLoadDone;
let configLoadPromise = new Promise((v) => {
  configLoadDone = v;
});
UpdateConfig.loadFromCookie();
configLoadDone();
Misc.getReleasesFromGitHub();
// getPatreonNames();

$(document).on("mouseenter", "#resultWordsHistory .words .word", (e) => {
  if (TestUI.resultVisible) {
    let input = $(e.currentTarget).attr("input");
    if (input != undefined)
      $(e.currentTarget).append(
        `<div class="wordInputAfter">${input
          .replace(/\t/g, "_")
          .replace(/\n/g, "_")}</div>`
      );
  }
});

$(document).on("click", "#bottom .leftright .right .current-theme", (e) => {
  if (e.shiftKey) {
    UpdateConfig.toggleCustomTheme();
  } else {
    // if (Config.customTheme) {
    //   toggleCustomTheme();
    // }
    CommandlineLists.setCurrent(CommandlineLists.themeCommands);
    Commandline.show();
  }
});

$(document).on("click", ".keymap .r5 #KeySpace", (e) => {
  CommandlineLists.setCurrent(CommandlineLists.commandsKeymapLayouts);
  Commandline.show();
});

$(document).on("mouseleave", "#resultWordsHistory .words .word", (e) => {
  $(".wordInputAfter").remove();
});

$("#wpmChart").on("mouseleave", (e) => {
  $(".wordInputAfter").remove();
});

let mappedRoutes = {
  "/": "pageTest",
  "/login": "pageLogin",
  "/settings": "pageSettings",
  "/about": "pageAbout",
  "/account": "pageAccount",
  "/verify": "pageTest",
};

function handleInitialPageClasses(el) {
  $(el).removeClass("hidden");
  $(el).addClass("active");
}

$(document).ready(() => {
  handleInitialPageClasses(
    $(".page." + mappedRoutes[window.location.pathname])
  );
  if (window.location.pathname === "/") {
    $("#top .config").removeClass("hidden");
  }
  $("body").css("transition", ".25s");
  if (Config.quickTab) {
    $("#restartTestButton").addClass("hidden");
  }
  if (!Misc.getCookie("merchbannerclosed")) {
    $(".merchBanner").removeClass("hidden");
  } else {
    $(".merchBanner").remove();
  }
  $("#centerContent")
    .css("opacity", "0")
    .removeClass("hidden")
    .stop(true, true)
    .animate({ opacity: 1 }, 250, () => {
      if (window.location.pathname === "/verify") {
        const fragment = new URLSearchParams(window.location.hash.slice(1));
        if (fragment.has("access_token")) {
          const accessToken = fragment.get("access_token");
          const tokenType = fragment.get("token_type");
          verifyUserWhenLoggedIn = {
            accessToken: accessToken,
            tokenType: tokenType,
          };
          history.replaceState("/", null, "/");
        }
      } else if (window.location.pathname === "/account") {
        // history.replaceState("/", null, "/");
      } else if (/challenge_.+/g.test(window.location.pathname)) {
        //do nothing
        // }
      } else if (window.location.pathname !== "/") {
        let page = window.location.pathname.replace("/", "");
        changePage(page);
      }
    });
  settingsFillPromise.then(updateSettingsPage);
});

$(".scrollToTopButton").click((event) => {
  window.scrollTo(0, 0);
});

$(".merchBanner a").click((event) => {
  $(".merchBanner").remove();
  Misc.setCookie("merchbannerclosed", true, 365);
});

$(".merchBanner .fas").click((event) => {
  $(".merchBanner").remove();
  Misc.setCookie("merchbannerclosed", true, 365);
  Notifications.add(
    "Won't remind you anymore. Thanks for continued support <3",
    0,
    5
  );
});

$(".pageTest #copyWordsListButton").click(async (event) => {
  try {
    let words;
    if (Config.mode == "zen") {
      words = TestLogic.input.history.join(" ");
    } else {
      words = TestLogic.words
        .get()
        .slice(0, TestLogic.input.history.length)
        .join(" ");
    }
    await navigator.clipboard.writeText(words);
    Notifications.add("Copied to clipboard", 0, 2);
  } catch (e) {
    Notifications.add("Could not copy to clipboard: " + e, -1);
  }
});

//stop space scrolling
window.addEventListener("keydown", function (e) {
  if (e.keyCode == 32 && e.target == document.body) {
    e.preventDefault();
  }
});
