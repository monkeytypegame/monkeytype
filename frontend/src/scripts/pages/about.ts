import Page from "./page";
import {
  getSupporters,
  getContributors,
} from "../controllers/json-lists-controller";

export function reset(): void {
  $(".pageAbout .contributors").empty();
  $(".pageAbout .supporters").empty();
}

export async function fill(): Promise<void> {
  const supporters = await getSupporters();
  const contributors = await getContributors();
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
