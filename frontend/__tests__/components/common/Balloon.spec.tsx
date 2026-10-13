import { cleanup, render } from "@solidjs/testing-library";
import {
  AnyRouter,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/solid-router";
import { afterEach, describe, expect, it } from "vitest";

import { Balloon } from "../../../src/ts/components/common/Balloon";

describe("Balloon component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a div with the balloon text", () => {
    const { container } = render(() => (
      <Balloon text="hello" position="down">
        content
      </Balloon>
    ));

    const div = container.querySelector("div");
    expect(div).toHaveAttribute("aria-label", "hello");
    expect(div).toHaveAttribute("data-balloon-pos", "down");
    expect(div).toHaveTextContent("content");
  });

  it("renders a router link with params and search when to is provided", () => {
    const router = createTestRouter();

    const { container } = render(() => (
      <RouterContextProvider router={router}>
        {() => (
          <Balloon
            to="/leaderboards"
            search={{ type: "daily", mode2: "15" }}
            text="Show daily leaderboard"
            class="rank"
          >
            1st
          </Balloon>
        )}
      </RouterContextProvider>
    ));

    const anchor = container.querySelector("a");
    expect(anchor).toHaveAttribute("href", "/leaderboards?type=daily&mode2=15");
    expect(anchor).toHaveAttribute("aria-label", "Show daily leaderboard");
    expect(anchor).toHaveAttribute("data-balloon-pos", "up");
    expect(anchor).toHaveClass("rank");
    expect(anchor).toHaveTextContent("1st");
  });
});

function createTestRouter(): AnyRouter {
  const root = createRootRoute();
  return createRouter({
    routeTree: root.addChildren([
      createRoute({ getParentRoute: () => root, path: "/" }),
      createRoute({ getParentRoute: () => root, path: "/leaderboards" }),
    ]),
    history: createMemoryHistory(),
    // same string search format as the app router
    parseSearch: (searchStr) =>
      Object.fromEntries(new URLSearchParams(searchStr)),
    stringifySearch: (search) => {
      const str = new URLSearchParams(
        search as Record<string, string>,
      ).toString();
      return str === "" ? "" : `?${str}`;
    },
  });
}
