import * as Misc from "../utils/misc";
import Page from "./page";

function reset(): void {
  $(".pageAbout .contributors").empty();
  $(".pageAbout .supporters").empty();
}

async function fill(): Promise<void> {
  const supporters = await Misc.getSupportersList();
  const contributors = await Misc.getContributorsList();
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
  async () => {
    //
  },
  async () => {
    reset();
  },
  async () => {
    fill();
  },
  async () => {
    //
  }
);
