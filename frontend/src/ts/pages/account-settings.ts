import Page from "./page";
import * as Skeleton from "../utils/skeleton";
import { getAuthenticatedUser, isAuthenticated } from "../firebase";
import * as ActivePage from "../states/active-page";
import { swapElements } from "../utils/misc";

const pageElement = $(".page.pageAccountSettings");

type State = {
  activeTab: "authentication" | "integrations" | "api" | "dangerZone";
};

const state: State = {
  activeTab: "authentication",
};

function updateAuthenticationSections(): void {
  pageElement.find(".section.passwordAuthSettings button").addClass("hidden");
  pageElement.find(".section.googleAuthSettings button").addClass("hidden");
  pageElement.find(".section.githubAuthSettings button").addClass("hidden");

  if (!isAuthenticated()) return;
  const user = getAuthenticatedUser();

  const passwordProvider = user.providerData.some(
    (provider) => provider.providerId === "password"
  );
  const googleProvider = user.providerData.some(
    (provider) => provider.providerId === "google.com"
  );
  const githubProvider = user.providerData.some(
    (provider) => provider.providerId === "github.com"
  );

  if (passwordProvider) {
    pageElement
      .find(".section.passwordAuthSettings #emailPasswordAuth")
      .removeClass("hidden");
    pageElement
      .find(".section.passwordAuthSettings #passPasswordAuth")
      .removeClass("hidden");
    if (googleProvider || githubProvider) {
      pageElement
        .find(".section.passwordAuthSettings #removePasswordAuth")
        .removeClass("hidden");
    }
  } else {
    pageElement
      .find(".section.passwordAuthSettings #addPasswordAuth")
      .removeClass("hidden");
  }

  if (googleProvider) {
    pageElement
      .find(".section.googleAuthSettings #removeGoogleAuth")
      .removeClass("hidden");
    if (passwordProvider || githubProvider) {
      pageElement
        .find(".section.googleAuthSettings #removeGoogleAuth")
        .removeClass("disabled");
    } else {
      pageElement
        .find(".section.googleAuthSettings #removeGoogleAuth")
        .addClass("disabled");
    }
  } else {
    pageElement
      .find(".section.googleAuthSettings #addGoogleAuth")
      .removeClass("hidden");
  }
  if (githubProvider) {
    pageElement
      .find(".section.githubAuthSettings #removeGithubAuth")
      .removeClass("hidden");
    if (passwordProvider || googleProvider) {
      pageElement
        .find(".section.githubAuthSettings #removeGithubAuth")
        .removeClass("disabled");
    } else {
      pageElement
        .find(".section.githubAuthSettings #removeGithubAuth")
        .addClass("disabled");
    }
  } else {
    pageElement
      .find(".section.githubAuthSettings #addGithubAuth")
      .removeClass("hidden");
  }
}

function updateTabs(): void {
  void swapElements(
    pageElement.find(".tab.active"),
    pageElement.find(`.tab[data-tab="${state.activeTab}"]`),
    250,
    async () => {
      //
    },
    async () => {
      pageElement.find(".tab").removeClass("active");
      pageElement
        .find(`.tab[data-tab="${state.activeTab}"]`)
        .addClass("active");
    }
  );
  pageElement.find("button").removeClass("active");
  pageElement.find(`button[data-tab="${state.activeTab}"]`).addClass("active");
}

$(".page.pageAccountSettings").on("click", ".tabs button", (event) => {
  state.activeTab = $(event.target).data("tab");
  updateTabs();
});

export function updateUI(): void {
  if (ActivePage.get() !== "accountSettings") return;
  updateAuthenticationSections();
  updateTabs();
}

export const page = new Page({
  name: "accountSettings",
  element: pageElement,
  path: "/account-settings",
  afterHide: async (): Promise<void> => {
    Skeleton.remove("pageAccountSettings");
  },
  beforeShow: async (): Promise<void> => {
    Skeleton.append("pageAccountSettings", "main");
    updateUI();
  },
});

$(() => {
  Skeleton.save("pageAccountSettings");
});
