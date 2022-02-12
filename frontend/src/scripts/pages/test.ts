// @ts-ignore
import Config from "../config";
// @ts-ignore
import * as TestStats from "../test/test-stats";
// @ts-ignore
import * as TestUI from "../test/test-ui";
// @ts-ignore
import * as ManualRestart from "../test/manual-restart-tracker";
// @ts-ignore
import * as TestConfig from "../test/test-config";
// @ts-ignore
import * as TestLogic from "../test/test-logic";
// @ts-ignore
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
