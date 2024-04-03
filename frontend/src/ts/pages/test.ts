import * as TestStats from "../test/test-stats";
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

export const page = new Page({
  name: "test",
  element: $(".page.pageTest"),
  path: "/",
  beforeHide: async (options): Promise<void> => {
    ManualRestart.set();
    TestLogic.restart({
      tribeOverride: options.tribeOverride ?? false,
    });
    void Funbox.clear();
    void ModesNotice.update();
    $("#wordsInput").trigger("focusout");
  },
  afterHide: async (): Promise<void> => {
    updateFooterAndVerticalAds(true);
  },
  beforeShow: async (options): Promise<void> => {
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
    void TestConfig.instantUpdate();
    void Funbox.activate();
    void Keymap.refresh();
  },
});
