import { afterEach, describe, expect, it } from "vitest";

import { getServerConfigurationQueryOptions } from "../../src/ts/queries/server-configuration";
import {
  App,
  cleanupApp,
  deferred,
  flush,
  renderApp,
} from "../__harness__/app-shell";

const serverConfigurationKey = getServerConfigurationQueryOptions().queryKey;

function retryButton(app: App): HTMLButtonElement {
  const button = [
    ...(app.pageElement()?.querySelectorAll("button") ?? []),
  ].find((el) => el.textContent?.includes("Retry"));
  if (button === undefined) throw new Error("no Retry button");
  return button;
}

describe("app shell routing", () => {
  afterEach(() => {
    cleanupApp();
  });

  describe("guards", () => {
    it.each(["/account", "/account-settings", "/friends"])(
      "redirects a signed out user from %s to login",
      async (url) => {
        const app = renderApp({ url, auth: "signedOut" });
        await app.settle();

        expect(app.url()).toBe("/login");
        expect(app.shownPage()).toBe("login");
      },
    );

    it("redirects a signed in user from login to account", async () => {
      const app = renderApp({ url: "/login", auth: "signedIn" });
      await app.settle();

      expect(app.url()).toBe("/account");
    });

    it("lets a signed in user open account settings", async () => {
      const app = renderApp({ url: "/account-settings", auth: "signedIn" });
      await app.settle();

      expect(app.url()).toBe("/account-settings");
      expect(app.shownPage()).toBe("accountSettings");
    });

    it("sends guarded pages to the test page when auth is unavailable", async () => {
      const app = renderApp({ url: "/friends", authAvailable: false });
      await app.settle();

      expect(app.url()).toBe("/");
      expect(app.shownPage()).toBe("test");
    });

    it("waits for the first auth state before redirecting on a refresh", async () => {
      const app = renderApp({ url: "/account-settings", auth: "pending" });
      await flush();

      expect(app.url()).toBe("/account-settings");
      expect(app.shownPage()).toBe("loading");

      app.auth.signOut();
      await app.settle();

      expect(app.url()).toBe("/login");
      expect(app.shownPage()).toBe("login");
    });

    it("keeps a guarded page when the first auth state is signed in", async () => {
      const app = renderApp({ url: "/account-settings", auth: "pending" });
      await flush();

      app.auth.signIn();
      await app.settle();

      expect(app.url()).toBe("/account-settings");
      expect(app.shownPage()).toBe("accountSettings");
    });

    it("redirects to account when the user signs in on login", async () => {
      const app = renderApp({ url: "/login", auth: "signedOut" });
      await app.settle();

      app.auth.signIn();
      await app.settle();

      expect(app.url()).toBe("/account");
    });

    it("redirects to login when the user signs out on a guarded page", async () => {
      const app = renderApp({ url: "/account-settings", auth: "signedIn" });
      await app.settle();

      app.auth.signOut();
      await app.settle();

      expect(app.url()).toBe("/login");
      expect(app.shownPage()).toBe("login");
    });

    it("redirects when navigating to a guarded page", async () => {
      const app = renderApp({ url: "/about", auth: "signedOut" });
      await app.settle();
      expect(app.shownPage()).toBe("about");

      await app.navigate({ to: "/friends" });
      await app.settle();

      expect(app.url()).toBe("/login");
      expect(app.shownPage()).toBe("login");
    });
  });

  describe("loading", () => {
    it("shows the loading page while the user data downloads", async () => {
      const userData = deferred();
      const app = renderApp({ url: "/settings", auth: "pending" });
      await flush();

      app.auth.signIn({ userData: userData.promise });
      await flush();
      expect(app.shownPage()).toBe("loading");

      userData.resolve();
      await app.settle();

      expect(app.shownPage()).toBe("settings");
    });

    it("waits for the server configuration on leaderboards", async () => {
      const configuration = deferred<unknown>();
      const app = renderApp({
        url: "/leaderboards",
        queryResponses: [
          [serverConfigurationKey, async () => configuration.promise],
        ],
      });
      await flush();
      expect(app.shownPage()).toBe("loading");

      configuration.resolve({});
      await app.settle();

      expect(app.shownPage()).toBe("leaderboards");
    });

    it("shows leaderboards straight away with a cached server configuration", async () => {
      const app = renderApp({
        url: "/about",
        queryData: [[serverConfigurationKey, {}]],
      });
      await app.settle();

      await app.navigate({ to: "/leaderboards" });
      expect(app.runningFades()).toHaveLength(1);
      expect(app.finishFade()).toBe(0);
      await app.settle();

      expect(app.shownPage()).toBe("leaderboards");
    });
  });

  describe("page fade", () => {
    it("fades the old page out before the new page is in the DOM", async () => {
      const app = renderApp({ url: "/about" });
      await app.settle();

      await app.navigate({ to: "/settings" });
      await flush();
      expect(app.pagesInDom()).toEqual(["about"]);
      expect(app.runningFades()).toHaveLength(1);
      expect(app.finishFade()).toBe(0);

      await flush();
      expect(app.pagesInDom()).toEqual(["settings"]);
      expect(app.finishFade()).toBe(1);
      expect(app.runningFades()).toHaveLength(0);
    });

    it("holds the new page at opacity 0 until its fade in finishes", async () => {
      const app = renderApp({ url: "/about" });
      await app.settle();

      await app.navigate({ to: "/settings" });
      await flush();
      app.finishFade();
      await flush();

      expect(app.pageElement()?.style.opacity).toBe("0");
      app.finishFade();
      await flush();
      expect(app.pageElement()?.style.opacity).toBe("");
    });

    it("ends on the last page after navigating during the fade out", async () => {
      const app = renderApp({ url: "/about" });
      await app.settle();

      await app.navigate({ to: "/settings" });
      await app.navigate({ to: "/login" });
      await app.navigate({ to: "/profile" });
      await flush();
      expect(app.finishFade()).toBe(0);
      await app.settle();

      expect(app.pagesInDom()).toEqual(["profileSearch"]);
      expect(app.pageElement()?.style.opacity).toBe("");
    });

    it("ends on the last page after navigating during the fade in", async () => {
      const app = renderApp({ url: "/about" });
      await app.settle();

      await app.navigate({ to: "/settings" });
      await flush();
      app.finishFade();
      await flush();
      expect(app.pagesInDom()).toEqual(["settings"]);

      await app.navigate({ to: "/login" });
      await app.settle();

      expect(app.pagesInDom()).toEqual(["login"]);
      expect(app.pageElement()?.style.opacity).toBe("");
    });

    it("ends on the last page when navigating before the fade in starts", async () => {
      const app = renderApp({ url: "/about" });
      await app.settle();

      await app.navigate({ to: "/settings" });
      await flush();
      app.finishFade();
      // the fade in starts on the next frame - navigate before it
      await app.navigate({ to: "/login" });
      await app.settle();

      expect(app.pagesInDom()).toEqual(["login"]);
      expect(app.pageElement()?.style.opacity).toBe("");
    });

    it("mounts page content only once its wrapper is in the document", async () => {
      const app = renderApp({ url: "/about" });
      await app.settle();

      await app.navigate({ to: "/settings" });
      await app.settle();

      expect(app.pageMounts()).toContainEqual({
        page: "Settings",
        attached: true,
      });
      expect(app.pageMounts().every((mount) => mount.attached)).toBe(true);
    });

    it("fades the first page in from the loading page", async () => {
      const userData = deferred();
      const app = renderApp({ url: "/settings", auth: "pending" });
      await flush();
      app.auth.signIn({ userData: userData.promise });
      await flush();
      expect(app.pagesInDom()).toEqual(["loading"]);
      // the loading page fades in on boot
      expect(app.finishFade()).toBe(1);

      userData.resolve();
      await flush();
      expect(app.pagesInDom()).toEqual(["loading"]);
      expect(app.finishFade()).toBe(0);

      await flush();
      expect(app.pagesInDom()).toEqual(["settings"]);
      expect(app.finishFade()).toBe(1);
    });
  });

  describe("errors", () => {
    async function failUserData(url: string): Promise<App> {
      const app = renderApp({ url, auth: "pending" });
      await flush();
      app.auth.signIn({
        userData: Promise.reject(new Error("server is down")),
      });
      await app.settle();
      return app;
    }

    it("shows the loading page with the error when a blocking load fails", async () => {
      const app = await failUserData("/settings");

      expect(app.pagesInDom()).toEqual(["loading"]);
      expect(app.pageElement()?.textContent).toContain(
        "Failed to load user data: server is down",
      );
    });

    it("retries the load and shows the page when it succeeds", async () => {
      const app = await failUserData("/settings");
      expect(app.shownPage()).toBe("loading");

      retryButton(app).click();
      await app.settle();

      expect(app.pagesInDom()).toEqual(["settings"]);
    });
  });

  describe("not found", () => {
    it.each(["/nope", "/settings/nope", "/profile/someone/nope"])(
      "shows the 404 page for %s",
      async (url) => {
        const app = renderApp({ url });
        await app.settle();

        expect(app.shownPage()).toBe("404");
        expect(app.url()).toBe(url);
      },
    );

    it("shows the 404 page when navigating to an unknown url", async () => {
      const app = renderApp({ url: "/about" });
      await app.settle();

      await app.router.navigate({ href: "/nope" });
      await app.settle();

      expect(app.pagesInDom()).toEqual(["404"]);
    });

    it("shows the profile page for a profile that doesn't exist", async () => {
      const app = renderApp({ url: "/profile/nobody" });
      await app.settle();

      expect(app.shownPage()).toBe("profile");
    });
  });

  it("redirects /verify to / keeping search and hash", async () => {
    const app = renderApp({ url: "/verify?mode=verifyEmail&oobCode=abc#top" });
    await app.settle();

    expect(app.url()).toBe("/?mode=verifyEmail&oobCode=abc#top");
    expect(app.shownPage()).toBe("test");
  });
});
