import { QueryClientProvider } from "@tanstack/solid-query";
import { JSXElement } from "solid-js";
import { render } from "solid-js/web";

import { queryClient } from "../queries";
import { qsa } from "../utils/dom";
import { Page } from "./common/Page";
import { Theme } from "./core/Theme";
import { DevTools } from "./dev/DevTools";
import { CommandlineHotkey } from "./hotkeys/CommandlineHotkey";
import { Footer } from "./layout/footer/Footer";
import { Header } from "./layout/header/Header";
import { Overlays } from "./layout/overlays/Overlays";
import { Modals } from "./modals/Modals";
import { NotFoundPage } from "./pages/404Page";
import { AboutPage } from "./pages/AboutPage";
import { AccountSettingsPage } from "./pages/account-settings/AccountSettingsPage";
import { AccountPage } from "./pages/account/AccountPage";
import { MyProfile } from "./pages/account/MyProfile";
import { FriendsPage } from "./pages/connections/FriendsPage";
import { LeaderboardPage } from "./pages/leaderboard/LeaderboardPage";
import { LoadingPage } from "./pages/LoadingPage";
import { LoginPage } from "./pages/login/LoginPage";
import { ProfilePage } from "./pages/profile/ProfilePage";
import { ProfileSearchPage } from "./pages/profile/ProfileSearchPage";
import { SettingsPage } from "./pages/settings/SettingsPage";
import { BarTimerProgress } from "./pages/test/live-stats/BarTimerProgress";
import { TestPage } from "./pages/test/TestPage";
import { Popups } from "./popups/Popups";

const components: Record<string, () => JSXElement> = {
  testpage: () => <TestPage />,
  footer: () => <Footer />,
  aboutpage: () => (
    <Page id="about">
      <AboutPage />
    </Page>
  ),
  settingspage: () => (
    <Page id="settings">
      <SettingsPage />
    </Page>
  ),
  accountpage: () => (
    <Page id="account" needsAuthentication>
      <AccountPage />
    </Page>
  ),
  loadingpage: () => <LoadingPage />,
  loginpage: () => (
    <Page id="login">
      <LoginPage />
    </Page>
  ),
  leaderboardpage: () => (
    <Page id="leaderboards">
      <LeaderboardPage />
    </Page>
  ),
  profilepage: () => (
    <Page id="profile">
      <ProfilePage />
    </Page>
  ),
  profilesearchpage: () => (
    <Page id="profileSearch">
      <ProfileSearchPage />
    </Page>
  ),
  myprofile: () => <MyProfile />,
  modals: () => <Modals />,
  popups: () => <Popups />,
  overlays: () => <Overlays />,
  theme: () => <Theme />,
  header: () => <Header />,
  devtools: () => <DevTools />,
  commandlinehotkey: () => <CommandlineHotkey />,
  friendspage: () => (
    <Page id="friends">
      <FriendsPage />
    </Page>
  ),
  notfoundpage: () => (
    <Page id="404">
      <NotFoundPage />
    </Page>
  ),
  accountsettingspage: () => (
    <Page id="accountSettings">
      <AccountSettingsPage />
    </Page>
  ),
  bartimerprogress: () => <BarTimerProgress />,
};

function mountToMountpoint(name: string, component: () => JSXElement): void {
  for (const mountPoint of qsa(name)) {
    render(
      () => (
        <QueryClientProvider client={queryClient}>
          {component()}
        </QueryClientProvider>
      ),
      mountPoint.native,
    );
  }
}

export function mountComponents(): void {
  for (const [query, component] of Object.entries(components)) {
    mountToMountpoint(`[data-component=${query}]`, component);
  }
}
