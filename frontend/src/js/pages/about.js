import * as Misc from "../misc";
import Page from "./page";

export function reset() {
  $(".pageAbout .contributors").empty();
  $(".pageAbout .supporters").empty();
}

export async function fill() {
  let supporters = await Misc.getSupportersList();
  let contributors = await Misc.getContributorsList();
  supporters.forEach((supporter) => {
    $(".pageAbout .supporters").append(`
      <div>${supporter}</div>
    `);
  });
  contributors.forEach((contributor) => {
    $(".pageAbout .contributors").append(`
      <div>${contributor}</div>
    `);
  });
}

export const page = new Page(
  "about",
  $(".page.pageAbout"),
  "/about",
  () => {
    //
  },
  async () => {
    reset();
  },
  () => {
    fill();
  },
  () => {
    //
  }
);
