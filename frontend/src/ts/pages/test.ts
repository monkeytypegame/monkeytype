import * as TestStats from "../test/test-stats";
import * as TestUI from "../test/test-ui";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as TestLogic from "../test/test-logic";
import * as Funbox from "../test/funbox/funbox";
import * as TestConfig from "../test/test-config";
import Page from "./page";
import { updateFooterAndVerticalAds } from "../controllers/ad-controller";
import * as ModesNotice from "../elements/modes-notice";
import * as Keymap from "../elements/keymap";
import * as TribeState from "../tribe/tribe-state";
import * as TestConfig from "../test/test-config";
import * as CookiePopup from "../popups/cookie-popup";

export const page = new Page(
  "test",
  $(".page.pageTest"),
  "/",
  async (options) => {
    ManualRestart.set();
    TestLogic.restart({
      tribeOverride: options.tribeOverride ?? false,
    });
    Funbox.clear();
    ModesNotice.update();
    $("#wordsInput").trigger("focusout");
  },
  async () => {
    updateFooterAndVerticalAds(true);
  },
  async (options) => {
    updateFooterAndVerticalAds(false);
    if (TribeState.getState() > 5) {
      TestConfig.hide();
    } else {
      TestConfig.show();
    }
    TestStats.resetIncomplete();
    ManualRestart.set();
    TestLogic.restart({
      noAnim: true,
      tribeOverride: options.tribeOverride ?? false,
    });
    TestConfig.instantUpdate();
    Funbox.activate();
    Keymap.refresh();
  },
  async () => {
    if (CookiePopup.isVisible()) {
      TestUI.blurWords();
      $("#cookiePopupWrapper").trigger("focus");
    } else {
      TestUI.focusWords();
    }
  }
);
