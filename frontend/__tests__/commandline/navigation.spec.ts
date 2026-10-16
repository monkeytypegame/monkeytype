import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/solid-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import navigationCommands from "../../src/ts/commandline/lists/navigation";
import type { Command } from "../../src/ts/commandline/types";
import { getRouter, setRouter } from "../../src/ts/router/instance";

const { isAuthenticated } = vi.hoisted(() => ({ isAuthenticated: vi.fn() }));
vi.mock("../../src/ts/states/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/ts/states/core")>()),
  isAuthenticated,
}));

// stands in for the app's route tree, which needs auth and page data to load
function createTestRouter(): ReturnType<typeof createRouter> {
  const root = createRootRoute();
  const paths = [
    "/",
    "/leaderboards",
    "/about",
    "/settings",
    "/login",
    "/account",
    "/profile/$uidOrName",
  ];
  return createRouter({
    routeTree: root.addChildren(
      paths.map((path) => createRoute({ getParentRoute: () => root, path })),
    ),
    history: createMemoryHistory({ initialEntries: ["/about"] }),
  });
}

let router: ReturnType<typeof createTestRouter>;

function command(id: string): Command {
  const found = navigationCommands.find((it) => it.id === id);
  if (found === undefined) throw new Error(`no command ${id}`);
  return found;
}

async function execAndGetHref(id: string, input?: string): Promise<string> {
  const before = router.state.location.href;
  command(id).exec?.({ input });
  // commands start the navigation without awaiting it
  await vi.waitFor(() => {
    expect(router.state.location.href).not.toBe(before);
  });
  return router.state.location.href;
}

describe("commandline navigation", () => {
  beforeEach(async () => {
    isAuthenticated.mockReturnValue(false);
    router = createTestRouter();
    await router.load();
    setRouter(router as never);
  });

  it.each([
    ["viewTypingPage", "/"],
    ["viewLeaderboards", "/leaderboards"],
    ["viewSettings", "/settings"],
  ])("%s opens %s", async (id, href) => {
    expect(await execAndGetHref(id)).toBe(href);
  });

  it("viewAbout opens /about", async () => {
    await router.navigate({ to: "/" });
    expect(await execAndGetHref("viewAbout")).toBe("/about");
  });

  it("viewAccount opens the login page when signed out", async () => {
    expect(await execAndGetHref("viewAccount")).toBe("/login");
  });

  it("viewAccount opens the account page when signed in", async () => {
    isAuthenticated.mockReturnValue(true);
    expect(await execAndGetHref("viewAccount")).toBe("/account");
  });

  it("searchProfile opens the profile of the entered name", async () => {
    expect(await execAndGetHref("searchProfile", "Miodec")).toBe(
      "/profile/Miodec",
    );
  });
});

// type checked only - a broken internal link fails the type check
export function brokenLinksDoNotTypeCheck(): void {
  const appRouter = getRouter();
  // @ts-expect-error -- not a route
  void appRouter?.navigate({ to: "/not-a-route" });
  // @ts-expect-error -- missing the uidOrName param
  void appRouter?.navigate({ to: "/profile/$uidOrName" });
}
