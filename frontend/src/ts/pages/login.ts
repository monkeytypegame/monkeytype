import Page from "./page";

export function enableInputs(): void {
  $(".pageLogin .button").removeClass("disabled");
  $(".pageLogin input").prop("disabled", false);
}

export function disableInputs(): void {
  $(".pageLogin .button").addClass("disabled");
  $(".pageLogin input").prop("disabled", true);
}

export function showPreloader(): void {
  $(".pageLogin .preloader").removeClass("hidden");
}

export function hidePreloader(): void {
  $(".pageLogin .preloader").addClass("hidden");
}

export const page = new Page(
  "login",
  $(".page.pageLogin"),
  "/login",
  () => {
    //
  },
  () => {
    //
  },
  () => {
    //
  },
  () => {
    //
  }
);
