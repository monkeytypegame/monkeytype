import { NotFoundPage } from "./404Page";
import { AboutPage } from "./AboutPage";
import { AccountSettingsPage } from "./account-settings/AccountSettingsPage";
import { AccountPage } from "./account/AccountPage";
import { FriendsPage } from "./connections/FriendsPage";
import { LeaderboardPage } from "./leaderboard/LeaderboardPage";
import { LoadingPage } from "./LoadingPage";
import { LoginPage } from "./login/LoginPage";
import { PageRegistry } from "./Pages";
import { ProfilePage } from "./profile/ProfilePage";
import { ProfileSearchPage } from "./profile/ProfileSearchPage";
import { SettingsPage } from "./settings/SettingsPage";
import { TestPage } from "./test/TestPage";

/** Every page's component and wrapper options, rendered by `Pages`. */
export const pageRegistry: PageRegistry = {
  loading: {
    component: LoadingPage,
    class:
      "grid h-full w-full content-center items-center gap-4 place-self-center text-center",
  },
  test: { component: TestPage, class: "full-width content-grid" },
  settings: { component: SettingsPage },
  about: { component: AboutPage, class: "full-width" },
  account: { component: AccountPage, needsAuthentication: true },
  login: { component: LoginPage },
  profile: { component: ProfilePage },
  profileSearch: { component: ProfileSearchPage },
  404: { component: NotFoundPage },
  accountSettings: { component: AccountSettingsPage },
  leaderboards: { component: LeaderboardPage },
  friends: { component: FriendsPage },
};
