import * as Funbox from "./../test/funbox";
import * as About from "./../pages/about";
import * as Misc from "./../misc";
import * as ActivePage from "./../states/active-page";
import * as TestLogic from "./../test/test-logic";
import * as Settings from "./../pages/settings";
import * as Account from "./../pages/account";
import * as TestUI from "./../test/test-ui";
import * as TestConfig from "./../test/test-config";
import * as SignOutButton from "./../account/sign-out-button";
import * as TestStats from "./../test/test-stats";
import * as ManualRestart from "./../test/manual-restart-tracker";
import Config from "./../config";

export let transition = true;

export function setTransition(val) {
  transition = val;
}

export function change(page, norestart = false) {
  if (transition) {
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
    setTransition(true);
    Misc.swapElements(
      activePageElement,
      $(".page.pageTest"),
      250,
      () => {
        setTransition(false);
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
    setTransition(true);
    TestLogic.restart();
    Misc.swapElements(activePageElement, $(".page.pageAbout"), 250, () => {
      setTransition(false);
      history.pushState("about", null, "about");
      $(".page.pageAbout").addClass("active");
      ActivePage.set("pageAbout");
    });
    About.fill();
    Funbox.activate("none");
    TestConfig.hide();
    SignOutButton.hide();
  } else if (page == "settings") {
    setTransition(true);
    TestLogic.restart();
    Misc.swapElements(activePageElement, $(".page.pageSettings"), 250, () => {
      setTransition(false);
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
      change("login");
    } else {
      setTransition(true);
      TestLogic.restart();
      Misc.swapElements(activePageElement, $(".page.pageAccount"), 250, () => {
        setTransition(false);
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
      change("account");
    } else {
      setTransition(true);
      TestLogic.restart();
      Misc.swapElements(activePageElement, $(".page.pageLogin"), 250, () => {
        setTransition(false);
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

$(document).on("click", "#top .logo", (e) => {
  change("test");
});

$(document).on("click", "#top #menu .icon-button", (e) => {
  if (!$(e.currentTarget).hasClass("leaderboards")) {
    const href = $(e.currentTarget).attr("href");
    ManualRestart.set();
    change(href.replace("/", ""));
  }
  return false;
});
