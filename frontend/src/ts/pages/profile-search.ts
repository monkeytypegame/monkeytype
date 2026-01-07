import Page from "./page";
import * as Skeleton from "../utils/skeleton";
import Ape from "../ape";
import { ValidatedHtmlInputElement } from "../elements/input-validation";
import { UserNameSchema, UserProfile } from "@monkeytype/schemas/users";
import { remoteValidation } from "../utils/remote-validation";
import * as NavigationEvent from "../observables/navigation-event";
import { qs, qsr, onWindowLoad } from "../utils/dom";

let nameInputEl: ValidatedHtmlInputElement | null = null;
let lastProfile: UserProfile | null = null;

function enableButton(): void {
  qs('.page.pageProfileSearch button[type="submit"]')?.enable();
}

function disableButton(): void {
  qs('.page.pageProfileSearch button[type="submit"]')?.disable();
}

export const page = new Page({
  id: "profileSearch",
  element: qsr(".page.pageProfileSearch"),
  path: "/profile",
  afterHide: async (): Promise<void> => {
    Skeleton.remove("pageProfileSearch");
  },
  beforeShow: async (): Promise<void> => {
    Skeleton.append("pageProfileSearch", "main");

    nameInputEl ??= new ValidatedHtmlInputElement(
      qsr(".page.pageProfileSearch input"),
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
    qs(".page.pageProfileSearch input")?.focus();
  },
});

qs(".page.pageProfileSearch form")?.on("submit", (e) => {
  e.preventDefault();
  if (lastProfile === null) return;
  NavigationEvent.dispatch(`/profile/${lastProfile.name}`, {
    data: lastProfile,
  });
});

onWindowLoad(() => {
  Skeleton.save("pageProfileSearch");
});
