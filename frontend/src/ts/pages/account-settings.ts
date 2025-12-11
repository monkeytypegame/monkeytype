import { PageWithUrlParams } from "./page";
import * as Skeleton from "../utils/skeleton";
import { getAuthenticatedUser, isAuthenticated } from "../firebase";
import * as ActivePage from "../states/active-page";
import { swapElements } from "../utils/misc";
import { getSnapshot } from "../db";
import Ape from "../ape";
import * as StreakHourOffsetModal from "../modals/streak-hour-offset";
import * as Loader from "../elements/loader";
import * as ApeKeyTable from "../elements/account-settings/ape-key-table";
import * as BlockedUserTable from "../elements/account-settings/blocked-user-table";
import * as Notifications from "../elements/notifications";
import { z } from "zod";
import * as AuthEvent from "../observables/auth-event";
import { qs, qsr } from "../utils/dom";

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
  pageElement.qs(".section.passwordAuthSettings button")?.addClass("hidden");
  pageElement.qs(".section.googleAuthSettings button")?.addClass("hidden");
  pageElement.qs(".section.githubAuthSettings button")?.addClass("hidden");

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
    pageElement
      .qs(".section.passwordAuthSettings #emailPasswordAuth")
      ?.removeClass("hidden");
    pageElement
      .qs(".section.passwordAuthSettings #passPasswordAuth")
      ?.removeClass("hidden");
    if (googleProvider || githubProvider) {
      pageElement
        .qs(".section.passwordAuthSettings #removePasswordAuth")
        ?.removeClass("hidden");
    }
  } else {
    pageElement
      .qs(".section.passwordAuthSettings #addPasswordAuth")
      ?.removeClass("hidden");
  }

  if (googleProvider) {
    pageElement
      .qs(".section.googleAuthSettings #removeGoogleAuth")
      ?.removeClass("hidden");
    if (passwordProvider || githubProvider) {
      pageElement
        .qs(".section.googleAuthSettings #removeGoogleAuth")
        ?.removeClass("disabled");
    } else {
      pageElement
        .qs(".section.googleAuthSettings #removeGoogleAuth")
        ?.addClass("disabled");
    }
  } else {
    pageElement
      .qs(".section.googleAuthSettings #addGoogleAuth")
      ?.removeClass("hidden");
  }
  if (githubProvider) {
    pageElement
      .qs(".section.githubAuthSettings #removeGithubAuth")
      ?.removeClass("hidden");
    if (passwordProvider || googleProvider) {
      pageElement
        .qs(".section.githubAuthSettings #removeGithubAuth")
        ?.removeClass("disabled");
    } else {
      pageElement
        .qs(".section.githubAuthSettings #removeGithubAuth")
        ?.addClass("disabled");
    }
  } else {
    pageElement
      .qs(".section.githubAuthSettings #addGithubAuth")
      ?.removeClass("hidden");
  }
}

function updateIntegrationSections(): void {
  //no code and no discord
  if (!isAuthenticated()) {
    pageElement.qs(".section.discordIntegration")?.addClass("hidden");
  } else {
    if (!getSnapshot()) return;
    pageElement.qs(".section.discordIntegration")?.removeClass("hidden");

    if (getSnapshot()?.discordId === undefined) {
      //show button
      pageElement
        .qs(".section.discordIntegration .buttons")
        ?.removeClass("hidden");
      pageElement.qs(".section.discordIntegration .info")?.addClass("hidden");
    } else {
      pageElement
        .qs(".section.discordIntegration .buttons")
        ?.addClass("hidden");
      pageElement
        .qs(".section.discordIntegration .info")
        ?.removeClass("hidden");
    }
  }
}

function updateTabs(): void {
  void swapElements(
    pageElement.qsa(".tab.active")[0] ?? null,
    pageElement.qsa(`.tab[data-tab="${state.tab}"]`)[0] ?? null,
    250,
    async () => {
      //
    },
    async () => {
      pageElement.qs(".tab")?.removeClass("active");
      pageElement.qs(`.tab[data-tab="${state.tab}"]`)?.addClass("active");
    },
  );
  pageElement.qs("button")?.removeClass("active");
  pageElement.qs(`button[data-tab="${state.tab}"]`)?.addClass("active");
}

function updateAccountSections(): void {
  pageElement.qs(".section.optOutOfLeaderboards .optedOut")?.addClass("hidden");
  pageElement
    .qs(".section.optOutOfLeaderboards .buttons")
    ?.removeClass("hidden");
  pageElement.qs(".section.setStreakHourOffset .info")?.addClass("hidden");
  pageElement
    .qs(".section.setStreakHourOffset .buttons")
    ?.removeClass("hidden");

  const snapshot = getSnapshot();
  if (snapshot?.lbOptOut === true) {
    pageElement
      .qs(".section.optOutOfLeaderboards .optedOut")
      ?.removeClass("hidden");
    pageElement
      .qs(".section.optOutOfLeaderboards .buttons")
      ?.addClass("hidden");
  }
  if (snapshot?.streakHourOffset !== undefined) {
    pageElement.qs(".section.setStreakHourOffset .info")?.removeClass("hidden");
    const sign = snapshot?.streakHourOffset > 0 ? "+" : "";
    pageElement
      .qs(".section.setStreakHourOffset .info span")
      ?.setText(sign + snapshot?.streakHourOffset);
    pageElement.qs(".section.setStreakHourOffset .buttons")?.addClass("hidden");
  }
}

export function updateUI(): void {
  if (ActivePage.get() !== "accountSettings") return;
  updateAuthenticationSections();
  updateIntegrationSections();
  updateAccountSections();
  void ApeKeyTable.update(updateUI);
  void BlockedUserTable.update();
  updateTabs();
  page.setUrlParams(state);
}

$(".page.pageAccountSettings").on("click", ".tabs button", (event) => {
  state.tab = $(event.target).data("tab") as State["tab"];
  updateTabs();
  page.setUrlParams(state);
});

qs(
  ".page.pageAccountSettings .section.discordIntegration .getLinkAndGoToOauth",
)?.on("click", () => {
  Loader.show();
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

AuthEvent.subscribe((event) => {
  if (event.type === "authConfigUpdated") {
    updateUI();
  }
});

export const page = new PageWithUrlParams({
  id: "accountSettings",
  display: "Account Settings",
  element: $(".page.pageAccountSettings"),
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

$(() => {
  Skeleton.save("pageAccountSettings");
});
