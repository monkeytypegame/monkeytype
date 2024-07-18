import * as TestStats from "../test/test-stats.js";
import * as ManualRestart from "../test/manual-restart-tracker.js";
import * as TestLogic from "../test/test-logic.js";
import * as Funbox from "../test/funbox/funbox.js";
import Page from "./page.js";
import { updateFooterAndVerticalAds } from "../controllers/ad-controller.js";
import * as ModesNotice from "../elements/modes-notice.js";
import * as Keymap from "../elements/keymap.js";
import * as TestConfig from "../test/test-config.js";

export const page = new Page({
  name: "test",
  element: $(".page.pageTest"),
  path: "/",
  beforeHide: async (): Promise<void> => {
    ManualRestart.set();
    TestLogic.restart();
    void Funbox.clear();
    void ModesNotice.update();
    $("#wordsInput").trigger("focusout");
  },
  afterHide: async (): Promise<void> => {
    updateFooterAndVerticalAds(true);
  },
  beforeShow: async (): Promise<void> => {
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
});
