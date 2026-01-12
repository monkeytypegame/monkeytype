import Page from "./page";
import * as Skeleton from "../utils/skeleton";

import { qsr, onWindowLoad } from "../utils/dom";

const pageElement = qsr(".page.pageAbout");
export const page = new Page({
  id: "about",
  element: pageElement,
  path: "/about",
  afterHide: async (): Promise<void> => {
    Skeleton.remove("pageAbout");
  },
  beforeShow: async (): Promise<void> => {
    Skeleton.append("pageAbout", "main");
  },
});

onDOMReady(() => {
  Skeleton.save("pageAbout");
});
