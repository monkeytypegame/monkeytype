import { PageWithUrlParams } from "./page";
import * as Skeleton from "../utils/skeleton";
import { getAuthenticatedUser, isAuthenticated } from "../firebase";
import { getActivePage } from "../signals/core";
import { swapElements } from "../utils/misc";
import { getSnapshot } from "../db";
import Ape from "../ape";
import * as StreakHourOffsetModal from "../modals/streak-hour-offset";
import { showLoaderBar } from "../signals/loader-bar";
import * as ApeKeyTable from "../elements/account-settings/ape-key-table";
import * as BlockedUserTable from "../elements/account-settings/blocked-user-table";
import * as Notifications from "../elements/notifications";
import { z } from "zod";
import * as AuthEvent from "../observables/auth-event";
import { qs, qsa, qsr, onDOMReady } from "../utils/dom";
import { showPopup } from "../modals/simple-modals-base";
import { addGithubAuth, addGoogleAuth } from "../auth";

const pageElement = qsr(".page.pageAccountSettings");

const StateSchema = z.object({
  tab: z.enum([
    "authentication",
    "account",
    "apeKeys",
    "dangerZone",
    "blockedUsers",
  ]),
});
type State = z.infer<typeof StateSchema>;

const UrlParameterSchema = StateSchema.partial();

const state: State = {
  tab: "account",
};

function updateAuthenticationSections(): void {
  pageElement.qsa(".section.passwordAuthSettings button")?.addClass("hidden");
  pageElement.qsa(".section.googleAuthSettings button")?.addClass("hidden");
  pageElement.qsa(".section.githubAuthSettings button")?.addClass("hidden");

  const user = getAuthenticatedUser();
  if (user === null) return;

  const passwordProvider = user.providerData.some(
    (provider) => provider.providerId === "password",
  );
  const googleProvider = user.providerData.some(
    (provider) => provider.providerId === "google.com",
  );
  const githubProvider = user.providerData.some(
    (provider) => provider.providerId === "github.com",
  );

  if (passwordProvider) {
    pageElement.qs(".section.passwordAuthSettings #emailPasswordAuth")?.show();
    pageElement.qs(".section.passwordAuthSettings #passPasswordAuth")?.show();
    if (googleProvider || githubProvider) {
      pageElement
        .qs(".section.passwordAuthSettings #removePasswordAuth")
        ?.show();
    }
  } else {
    pageElement.qs(".section.passwordAuthSettings #addPasswordAuth")?.show();
  }

  if (googleProvider) {
    pageElement.qs(".section.googleAuthSettings #removeGoogleAuth")?.show();
    if (passwordProvider || githubProvider) {
      pageElement.qs(".section.googleAuthSettings #removeGoogleAuth")?.enable();
    } else {
      pageElement
        .qs(".section.googleAuthSettings #removeGoogleAuth")
        ?.disable();
    }
  } else {
    pageElement.qs(".section.googleAuthSettings #addGoogleAuth")?.show();
  }
  if (githubProvider) {
    pageElement.qs(".section.githubAuthSettings #removeGithubAuth")?.show();
    if (passwordProvider || googleProvider) {
      pageElement.qs(".section.githubAuthSettings #removeGithubAuth")?.enable();
    } else {
      pageElement
        .qs(".section.githubAuthSettings #removeGithubAuth")
        ?.disable();
    }
  } else {
    pageElement.qs(".section.githubAuthSettings #addGithubAuth")?.show();
  }
}

function updateIntegrationSections(): void {
  //no code and no discord
  if (!isAuthenticated()) {
    pageElement.qs(".section.discordIntegration")?.hide();
  } else {
    if (!getSnapshot()) return;
    pageElement.qs(".section.discordIntegration")?.show();

    if (getSnapshot()?.discordId === undefined) {
      //show button
      pageElement.qs(".section.discordIntegration .buttons")?.show();
      pageElement.qs(".section.discordIntegration .info")?.hide();
    } else {
      pageElement.qs(".section.discordIntegration .buttons")?.hide();
      pageElement.qs(".section.discordIntegration .info")?.show();
    }
  }
}

function updateTabs(): void {
  void swapElements(
    pageElement.qs(".tab.active"),
    pageElement.qs(`.tab[data-tab="${state.tab}"]`),
    250,
    async () => {
      //
    },
    async () => {
      pageElement.qsa(".tab")?.removeClass("active");
      pageElement.qs(`.tab[data-tab="${state.tab}"]`)?.addClass("active");
      if (state.tab === "apeKeys") void ApeKeyTable.update(updateUI);
      if (state.tab === "blockedUsers") void BlockedUserTable.update();
    },
  );
  pageElement.qsa("button")?.removeClass("active");
  pageElement.qs(`button[data-tab="${state.tab}"]`)?.addClass("active");
}

function updateAccountSections(): void {
  pageElement.qs(".section.optOutOfLeaderboards .optedOut")?.hide();
  pageElement.qs(".section.optOutOfLeaderboards .buttons")?.show();
  pageElement.qs(".section.setStreakHourOffset .info")?.hide();
  pageElement.qs(".section.setStreakHourOffset .buttons")?.show();

  const snapshot = getSnapshot();
  if (snapshot?.lbOptOut === true) {
    pageElement.qs(".section.optOutOfLeaderboards .optedOut")?.show();
    pageElement.qs(".section.optOutOfLeaderboards .buttons")?.hide();
  }
  if (snapshot?.streakHourOffset !== undefined) {
    pageElement.qs(".section.setStreakHourOffset .info")?.show();
    const sign = snapshot?.streakHourOffset > 0 ? "+" : "";
    pageElement
      .qs(".section.setStreakHourOffset .info span")
      ?.setText(sign + snapshot?.streakHourOffset);
    pageElement.qs(".section.setStreakHourOffset .buttons")?.hide();
  }
}

export function updateUI(): void {
  if (getActivePage() !== "accountSettings") return;
  updateAuthenticationSections();
  updateIntegrationSections();
  updateAccountSections();
  updateTabs();
  page.setUrlParams(state);
}

qs(".page.pageAccountSettings")?.onChild("click", ".tabs button", (event) => {
  state.tab = (event.target as HTMLElement).getAttribute(
    "data-tab",
  ) as State["tab"];
  updateTabs();
  page.setUrlParams(state);
});

qsa(
  ".page.pageAccountSettings .section.discordIntegration .getLinkAndGoToOauth",
)?.on("click", () => {
  showLoaderBar();
  void Ape.users.getDiscordOAuth().then((response) => {
    if (response.status === 200) {
      window.open(response.body.data.url, "_self");
    } else {
      Notifications.add(
        "Failed to get OAuth from discord: " + response.body.message,
        -1,
      );
    }
  });
});

qs(".page.pageAccountSettings #setStreakHourOffset")?.on("click", () => {
  StreakHourOffsetModal.show();
});

qs(".pageAccountSettings")?.onChild("click", "#unlinkDiscordButton", () => {
  showPopup("unlinkDiscord");
});

qs(".pageAccountSettings")?.onChild("click", "#removeGoogleAuth", () => {
  showPopup("removeGoogleAuth");
});

qs(".pageAccountSettings")?.onChild("click", "#removeGithubAuth", () => {
  showPopup("removeGithubAuth");
});

qs(".pageAccountSettings")?.onChild("click", "#removePasswordAuth", () => {
  showPopup("removePasswordAuth");
});

qs(".pageAccountSettings")?.onChild("click", "#addPasswordAuth", () => {
  showPopup("addPasswordAuth");
});

qs(".pageAccountSettings")?.onChild("click", "#emailPasswordAuth", () => {
  showPopup("updateEmail");
});

qs(".pageAccountSettings")?.onChild("click", "#passPasswordAuth", () => {
  showPopup("updatePassword");
});

qs(".pageAccountSettings")?.onChild("click", "#deleteAccount", () => {
  showPopup("deleteAccount");
});

qs(".pageAccountSettings")?.onChild("click", "#resetAccount", () => {
  showPopup("resetAccount");
});

qs(".pageAccountSettings")?.onChild(
  "click",
  "#optOutOfLeaderboardsButton",
  () => {
    showPopup("optOutOfLeaderboards");
  },
);

qs(".pageAccountSettings")?.onChild("click", "#revokeAllTokens", () => {
  showPopup("revokeAllTokens");
});

qs(".pageAccountSettings")?.onChild(
  "click",
  "#resetPersonalBestsButton",
  () => {
    showPopup("resetPersonalBests");
  },
);

qs(".pageAccountSettings")?.onChild("click", "#updateAccountName", () => {
  showPopup("updateName");
});

qs(".pageAccountSettings")?.onChild("click", "#addGoogleAuth", () => {
  void addGoogleAuth();
});

qs(".pageAccountSettings")?.onChild("click", "#addGithubAuth", () => {
  void addGithubAuth();
});

AuthEvent.subscribe((event) => {
  if (event.type === "authConfigUpdated") {
    updateUI();
  }
});

export const page = new PageWithUrlParams({
  id: "accountSettings",
  display: "Account Settings",
  element: pageElement,
  path: "/account-settings",
  urlParamsSchema: UrlParameterSchema,
  afterHide: async (): Promise<void> => {
    Skeleton.remove("pageAccountSettings");
  },
  beforeShow: async (options): Promise<void> => {
    if (options.urlParams?.tab !== undefined) {
      state.tab = options.urlParams.tab;
    }
    Skeleton.append("pageAccountSettings", "main");
    pageElement.qs(`.tab[data-tab="${state.tab}"]`)?.addClass("active");
    updateUI();
  },
});

onDOMReady(() => {
  Skeleton.save("pageAccountSettings");
});
