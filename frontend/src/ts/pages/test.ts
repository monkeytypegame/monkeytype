import { leaveTestPage } from "../test/test-logic";
import Page from "./page";

export const page = new Page({
  id: "test",
  path: "/",
  // TestPage also calls this on unmount - calling it here ends the test as
  // soon as the navigation starts, before the fade out
  beforeHide: async (): Promise<void> => {
    leaveTestPage();
  },
});
