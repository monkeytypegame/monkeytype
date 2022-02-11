import Config, * as UpdateConfig from "./config";
import * as Notifications from "./elements/notifications";
import * as Caret from "./test/caret";
import * as TestLogic from "./test/test-logic";
import * as CustomText from "./test/custom-text";
import * as CommandlineLists from "./elements/commandline-lists";
import * as Commandline from "./elements/commandline";
import * as TestUI from "./test/test-ui";
import * as TestConfig from "./test/test-config";
import * as SignOutButton from "./account/sign-out-button";
import * as TestStats from "./test/test-stats";
import * as ManualRestart from "./test/manual-restart-tracker";
import * as Settings from "./pages/settings";
import * as Account from "./pages/account";
import * as Leaderboards from "./elements/leaderboards";
import * as Funbox from "./test/funbox";
import * as About from "./pages/about";
import * as Misc from "./misc";
import * as ActivePage from "./states/active-page";
import * as TestActive from "./states/test-active";

export let pageTransition = true;

export function setPageTransition(val) {
  pageTransition = val;
}

export function updateKeytips() {
  if (Config.swapEscAndTab) {
    $(".pageSettings .tip").html(`
    tip: You can also change all these settings quickly using the
    command line (
    <key>tab</key>
    )`);
    $("#bottom .keyTips").html(`
    <key>esc</key> - restart test<br>
      <key>tab</key> - command line`);
  } else {
    $(".pageSettings .tip").html(`
    tip: You can also change all these settings quickly using the
    command line (
    <key>esc</key>
    )`);
    $("#bottom .keyTips").html(`
    <key>tab</key> - restart test<br>
      <key>esc</key> or <key>ctrl/cmd</key>+<key>shift</key>+<key>p</key> - command line`);
  }
}

export function changePage(page, norestart = false) {
  if (pageTransition) {
    console.log(`change page ${page} stopped`);
    return;
  }

  if (page == undefined) {
    //use window loacation
    let pages = {
      "/": "test",
      "/login": "login",
      "/settings": "settings",
      "/about": "about",
      "/account": "account",
    };
    let path = pages[window.location.pathname];
    if (!path) {
      path = "test";
    }
    page = path;
  }

  console.log(`change page ${page}`);
  let activePageElement = $(".page.active");
  let check = ActivePage.get() + "";
  setTimeout(() => {
    if (check === "pageAccount" && page !== "account") {
      Account.reset();
    } else if (check === "pageSettings" && page !== "settings") {
      Settings.reset();
    } else if (check === "pageAbout" && page !== "about") {
      About.reset();
    }
  }, 250);

  ActivePage.set(undefined);
  $(".page").removeClass("active");
  $("#wordsInput").focusout();
  if (page == "test" || page == "") {
    setPageTransition(true);
    Misc.swapElements(
      activePageElement,
      $(".page.pageTest"),
      250,
      () => {
        setPageTransition(false);
        TestUI.focusWords();
        $(".page.pageTest").addClass("active");
        ActivePage.set("pageTest");
        history.pushState("/", null, "/");
      },
      () => {
        TestConfig.show();
      }
    );
    SignOutButton.hide();
    // restartCount = 0;
    // incompleteTestSeconds = 0;
    TestStats.resetIncomplete();
    ManualRestart.set();
    if (!norestart) TestLogic.restart();
    Funbox.activate(Config.funbox);
  } else if (page == "about") {
    setPageTransition(true);
    TestLogic.restart();
    Misc.swapElements(activePageElement, $(".page.pageAbout"), 250, () => {
      setPageTransition(false);
      history.pushState("about", null, "about");
      $(".page.pageAbout").addClass("active");
      ActivePage.set("pageAbout");
    });
    About.fill();
    Funbox.activate("none");
    TestConfig.hide();
    SignOutButton.hide();
  } else if (page == "settings") {
    setPageTransition(true);
    TestLogic.restart();
    Misc.swapElements(activePageElement, $(".page.pageSettings"), 250, () => {
      setPageTransition(false);
      history.pushState("settings", null, "settings");
      $(".page.pageSettings").addClass("active");
      ActivePage.set("pageSettings");
    });
    Funbox.activate("none");
    Settings.fillSettingsPage().then(() => {
      Settings.update();
    });
    // Settings.update();
    TestConfig.hide();
    SignOutButton.hide();
  } else if (page == "account") {
    if (!firebase.auth().currentUser) {
      console.log(
        `current user is ${firebase.auth().currentUser}, going back to login`
      );
      changePage("login");
    } else {
      setPageTransition(true);
      TestLogic.restart();
      Misc.swapElements(activePageElement, $(".page.pageAccount"), 250, () => {
        setPageTransition(false);
        history.pushState("account", null, "account");
        $(".page.pageAccount").addClass("active");
        ActivePage.set("pageAccount");
      });
      Funbox.activate("none");
      Account.update();
      TestConfig.hide();
    }
  } else if (page == "login") {
    if (firebase.auth().currentUser != null) {
      changePage("account");
    } else {
      setPageTransition(true);
      TestLogic.restart();
      Misc.swapElements(activePageElement, $(".page.pageLogin"), 250, () => {
        setPageTransition(false);
        history.pushState("login", null, "login");
        $(".page.pageLogin").addClass("active");
        ActivePage.set("pageLogin");
      });
      Funbox.activate("none");
      TestConfig.hide();
      SignOutButton.hide();
    }
  }
}

//checking if the project is the development site
/*
if (firebase.app().options.projectId === "monkey-type-dev-67af4") {
  $("#top .logo .bottom").text("monkey-dev");
  $("head title").text("Monkey Dev");
  $("body").append(
    `<div class="devIndicator tr">DEV</div><div class="devIndicator bl">DEV</div>`
  );
}
*/

if (window.location.hostname === "localhost") {
  window.onerror = function (error) {
    Notifications.add(error, -1);
  };
  $("#top .logo .top").text("localhost");
  $("head title").text($("head title").text() + " (localhost)");
  //firebase.functions().useFunctionsEmulator("http://localhost:5001");
  $("body").append(
    `<div class="devIndicator tl">local</div><div class="devIndicator br">local</div>`
  );
  $(".pageSettings .discordIntegration .buttons a").attr(
    "href",
    "https://discord.com/api/oauth2/authorize?client_id=798272335035498557&redirect_uri=http%3A%2F%2Flocalhost%3A5000%2Fverify&response_type=token&scope=identify"
  );
}

//stop space scrolling
window.addEventListener("keydown", function (e) {
  if (e.keyCode == 32 && e.target == document.body) {
    e.preventDefault();
  }
});

$(document).on("click", "#bottom .leftright .right .current-theme", (e) => {
  if (e.shiftKey) {
    UpdateConfig.setCustomTheme(!Config.customTheme);
  } else {
    // if (Config.customTheme) {
    //   toggleCustomTheme();
    // }
    CommandlineLists.pushCurrent(CommandlineLists.themeCommands);
    Commandline.show();
  }
});

$(document.body).on("click", ".pageAbout .aboutEnableAds", () => {
  CommandlineLists.pushCurrent(CommandlineLists.commandsEnableAds);
  Commandline.show();
});

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
    if (TestActive.get()) {
      event.preventDefault();
      // Chrome requires returnValue to be set.
      event.returnValue = "";
    }
  }
});

$(window).resize(() => {
  Caret.updatePosition();
});

$(document).on("click", "#top .logo", (e) => {
  changePage("test");
});

$(document).on("click", "#top #menu .icon-button", (e) => {
  if ($(e.currentTarget).hasClass("leaderboards")) {
    Leaderboards.show();
  } else {
    const href = $(e.currentTarget).attr("href");
    ManualRestart.set();
    changePage(href.replace("/", ""));
  }
  return false;
});

$(document).ready(() => {
  UpdateConfig.subscribeToEvent((eventKey) => {
    if (eventKey === "swapEscAndTab") updateKeytips();
  });
});
