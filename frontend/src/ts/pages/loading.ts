import Page from "./page";
import * as Skeleton from "../utils/skeleton";
import { promiseAnimate } from "../utils/misc";

const pageEl = $(".page.pageLoading");
const barEl = pageEl.find(".bar");
const errorEl = pageEl.find(".error");
const spinnerEl = pageEl.find(".spinner");
const textEl = pageEl.find(".text");

export async function updateBar(
  percentage: number,
  duration: number,
): Promise<void> {
  await promiseAnimate(barEl[0]?.querySelector(".fill") as HTMLElement, {
    width: percentage + "%",
    duration,
  });
}

export function updateText(text: string): void {
  textEl.removeClass("hidden").html(text);
}

export function showSpinner(): void {
  barEl.addClass("hidden");
  errorEl.addClass("hidden");
  spinnerEl.removeClass("hidden");
  textEl.addClass("hidden");
}

export function showError(): void {
  barEl.addClass("hidden");
  spinnerEl.addClass("hidden");
  errorEl.removeClass("hidden");
  textEl.addClass("hidden");
}

export async function showBar(): Promise<void> {
  barEl.removeClass("hidden");
  errorEl.addClass("hidden");
  spinnerEl.addClass("hidden");
  textEl.addClass("hidden");
}

export const page = new Page({
  id: "loading",
  element: pageEl,
  path: "/",
  afterHide: async (): Promise<void> => {
    Skeleton.remove("pageLoading");
  },
  beforeShow: async (): Promise<void> => {
    Skeleton.append("pageLoading", "main");
  },
});
