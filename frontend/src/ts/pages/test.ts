import * as TestLogic from "../test/test-logic";
import * as Funbox from "../test/funbox/funbox";
import Page from "./page";
import { updateFooterAndVerticalAds } from "../controllers/ad-controller";
import { blurInputElement } from "../input/input-element";
import { qsr } from "../utils/dom";
import { resetIncompleteTests } from "../states/test";

export const page = new Page({
  id: "test",
  element: qsr(".page.pageTest"),
  path: "/",
  beforeHide: async (): Promise<void> => {
    blurInputElement();
  },
  afterHide: async (): Promise<void> => {
    TestLogic.restart({
      noAnim: true,
    });
    void Funbox.clear();
    updateFooterAndVerticalAds(true);
  },
  beforeShow: async (options): Promise<void> => {
    updateFooterAndVerticalAds(false);
    resetIncompleteTests();
    TestLogic.restart({
      noAnim: true,
      tribeOverride: options.tribeOverride ?? false,
    });
  },
});
