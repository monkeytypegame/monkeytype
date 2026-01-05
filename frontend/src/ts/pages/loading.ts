import Page from "./page";
import * as Skeleton from "../utils/skeleton";
import { qs, qsr } from "../utils/dom";

const pageEl = qs(".page.pageLoading");
const barEl = pageEl?.qs(".bar");
const errorEl = pageEl?.qs(".error");
const spinnerEl = pageEl?.qs(".spinner");
const textEl = pageEl?.qs(".text");

export async function updateBar(
  percentage: number,
  duration: number,
): Promise<void> {
  await barEl?.qs(".fill")?.promiseAnimate({
    width: percentage + "%",
    duration,
  });
}

export function updateText(text: string): void {
  textEl?.show()?.setHtml(text);
}

export function showSpinner(): void {
  barEl?.hide();
  errorEl?.hide();
  spinnerEl?.show();
  textEl?.hide();
}

export function showError(): void {
  barEl?.hide();
  spinnerEl?.hide();
  errorEl?.show();
  textEl?.hide();
}

export async function showBar(): Promise<void> {
  barEl?.show();
  errorEl?.hide();
  spinnerEl?.hide();
  textEl?.hide();
}

export const page = new Page({
  id: "loading",
  element: qsr(".page.pageLoading"),
  path: "/",
  afterHide: async (): Promise<void> => {
    Skeleton.remove("pageLoading");
  },
  beforeShow: async (): Promise<void> => {
    Skeleton.append("pageLoading", "main");
  },
});
