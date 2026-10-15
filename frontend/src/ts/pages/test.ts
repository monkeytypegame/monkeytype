import { leaveTestPage } from "../test/test-logic";
import Page from "./page";
import { qsr } from "../utils/dom";

export const page = new Page({
  id: "test",
  element: qsr(".page.pageTest"),
  path: "/",
  // TestPage also calls this on unmount - calling it here ends the test as
  // soon as the navigation starts, before the fade out
  beforeHide: async (): Promise<void> => {
    leaveTestPage();
  },
});
