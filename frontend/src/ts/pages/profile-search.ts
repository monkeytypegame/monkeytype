import Page from "./page";
import * as Skeleton from "../utils/skeleton";
import Ape from "../ape";
import { ValidatedHtmlInputElement } from "../elements/input-validation";
import { UserNameSchema, UserProfile } from "@monkeytype/schemas/users";
import { remoteValidation } from "../utils/remote-validation";
import * as NavigationEvent from "../observables/navigation-event";

let nameInputEl: ValidatedHtmlInputElement | null = null;
let lastProfile: UserProfile | null = null;

function enableButton(): void {
  $('.page.pageProfileSearch button[type="submit"]').prop("disabled", false);
}

function disableButton(): void {
  $('.page.pageProfileSearch button[type="submit"]').prop("disabled", true);
}

export const page = new Page({
  id: "profileSearch",
  element: $(".page.pageProfileSearch"),
  path: "/profile",
  afterHide: async (): Promise<void> => {
    Skeleton.remove("pageProfileSearch");
  },
  beforeShow: async (): Promise<void> => {
    Skeleton.append("pageProfileSearch", "main");

    nameInputEl ??= new ValidatedHtmlInputElement(
      document.querySelector(
        ".page.pageProfileSearch input",
      ) as HTMLInputElement,
      {
        schema: UserNameSchema,
        isValid: remoteValidation(
          async (name) => Ape.users.getProfile({ params: { uidOrName: name } }),
          {
            check: (data) => {
              lastProfile = data;
              return true;
            },
            on4xx: () => "Unknown user",
          },
        ),
        callback: (result) => {
          if (result.status === "success") {
            enableButton();
          } else {
            disableButton();
            lastProfile = null;
          }
        },
      },
    );

    nameInputEl.setValue(null);
    disableButton();
  },
  afterShow: async (): Promise<void> => {
    $(".page.pageProfileSearch input").trigger("focus");
  },
});

$(".page.pageProfileSearch form").on("submit", (e) => {
  e.preventDefault();
  if (lastProfile === null) return;
  NavigationEvent.dispatch({
    url: `/profile/${lastProfile.name}`,
    data: lastProfile,
  });
});

$(() => {
  Skeleton.save("pageProfileSearch");
});
