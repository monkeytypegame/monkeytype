import * as TestStats from "../test/test-stats";
import * as TestUI from "../test/test-ui";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as TestLogic from "../test/test-logic";
import * as Funbox from "../test/funbox/funbox";
import Page from "./page";
import { updateFooterAndVerticalAds } from "../controllers/ad-controller";
import * as ModesNotice from "../elements/modes-notice";
import * as Keymap from "../elements/keymap";
import * as TestConfig from "../test/test-config";
import * as CookiePopup from "../popups/cookie-popup";

export const page = new Page(
  "test",
  $(".page.pageTest"),
  "/",
  async () => {
    ManualRestart.set();
    TestLogic.restart();
    void Funbox.clear();
    void ModesNotice.update();
    $("#wordsInput").trigger("focusout");
  },
  async () => {
    updateFooterAndVerticalAds(true);
  },
  async () => {
    updateFooterAndVerticalAds(false);
    TestStats.resetIncomplete();
    ManualRestart.set();
    TestLogic.restart({
      noAnim: true,
    });
    void TestConfig.instantUpdate();
    void Funbox.activate();
    void Keymap.refresh();
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
