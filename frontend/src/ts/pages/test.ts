import Config from "../config";
import * as TestStats from "../test/test-stats";
import * as TestUI from "../test/test-ui";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as TestConfig from "../test/test-config";
import * as TestLogic from "../test/test-logic";
import * as Funbox from "../test/funbox";
import Page from "./page";
import { updateTestPageAds } from "../controllers/ad-controller";

export const page = new Page(
  "test",
  $(".page.pageTest"),
  "/",
  async (options) => {
    TestLogic.restart({
      tribeOverride: options.tribeOverride ?? false,
    });
    Funbox.clear();
    TestConfig.hide();
    $("#wordsInput").focusout();
  },
  async () => {
    updateTestPageAds(true);
  },
  async (options) => {
    updateTestPageAds(false);
    TestConfig.show();
    TestStats.resetIncomplete();
    ManualRestart.set();
    TestLogic.restart({
      noAnim: true,
      tribeOverride: options.tribeOverride ?? false,
    });
    Funbox.activate(Config.funbox);
  },
  async () => {
    TestUI.focusWords();
  }
);
