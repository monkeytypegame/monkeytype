import Config from "../config";
import * as TestStats from "../test/test-stats";
import * as TestUI from "../test/test-ui";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as TestConfig from "../test/test-config";
import * as TestLogic from "../test/test-logic";
import * as Funbox from "../test/funbox";
import Page from "./page";

export const page = new Page(
  "test",
  $(".page.pageTest"),
  "/",
  async () => {
    TestLogic.restart();
    Funbox.clear();
    TestConfig.hide();
    $("#wordsInput").focusout();
  },
  async () => {
    //
  },
  () => {
    TestConfig.show();
    TestStats.resetIncomplete();
    ManualRestart.set();
    TestLogic.restart(undefined, undefined, undefined, undefined, true);
    Funbox.activate(Config.funbox);
  },
  () => {
    TestUI.focusWords();
  }
);
