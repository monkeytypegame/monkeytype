import { cleanup, render } from "@solidjs/testing-library";
import {
  AnyRouter,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/solid-router";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Button } from "../../../src/ts/components/common/Button";
import { FaSolidIcon } from "../../../src/ts/types/font-awesome";

describe("Button component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a button element when onClick is provided", () => {
    const onClick = vi.fn();

    const { container } = render(() => (
      <Button onClick={onClick} text="Click me" />
    ));

    const button = container.querySelector("button");
    expect(button).toBeTruthy();
    expect(button).toHaveTextContent("Click me");
    expect(button).not.toBeDisabled();
  });

  it("renders an anchor element when href is provided", () => {
    const { container } = render(() => (
      <Button href="https://example.com" text="Go" />
    ));

    const anchor = container.querySelector("a");
    expect(anchor).toBeTruthy();
    expect(anchor).toHaveAttribute("href", "https://example.com");
    expect(anchor).toHaveAttribute("target", "_blank");
    expect(anchor).toHaveAttribute("rel", "noreferrer noopener");
    expect(anchor).not.toHaveAttribute("router-link");
    expect(anchor).not.toHaveAttribute("aria-label");
    expect(anchor).not.toHaveAttribute("data-balloon-pos");
  });

  it("calls onClick when button is clicked", async () => {
    const onClick = vi.fn();

    const { container } = render(() => (
      <Button onClick={onClick} text="Click me" />
    ));

    const button = container.querySelector("button");
    button?.click();

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders icon when icon prop is provided", () => {
    const { container } = render(() => (
      <Button
        onClick={() => {
          //
        }}
        fa={{
          icon: "fa-keyboard",
        }}
      />
    ));

    const icon = container.querySelector("i");
    expect(icon).toBeTruthy();
    expect(icon).toHaveClass("fas");
    expect(icon).toHaveClass("fa-keyboard");
  });

  it("renders icon when icon prop has changed", () => {
    const [icon, setIcon] = createSignal<FaSolidIcon>("fa-keyboard");
    const { container } = render(() => (
      <Button
        onClick={() => {
          //
        }}
        fa={{
          icon: icon(),
          class: "test",
        }}
      />
    ));

    setIcon("fa-backward");

    const i = container.querySelector("i");
    expect(i).toBeTruthy();
    expect(i).toHaveClass("fas");
    expect(i).toHaveClass("fa-backward");
    expect(i).toHaveClass("test");
  });

  it("applies fa-fw class when fixedWidthIcon is true", () => {
    const { container } = render(() => (
      <Button
        onClick={() => {
          //
        }}
        fa={{
          fixedWidth: true,
          icon: "fa-keyboard",
        }}
        text="Hello"
      />
    ));

    const icon = container.querySelector("i");
    expect(icon).toHaveClass("fa-fw");
  });

  it("does not apply fa-fw when text is present and fixedWidthIcon is false", () => {
    const { container } = render(() => (
      <Button
        onClick={() => {
          //
        }}
        fa={{
          icon: "fa-keyboard",
        }}
        text="Hello"
      />
    ));

    const icon = container.querySelector("i");
    expect(icon).not.toHaveClass("fa-fw");
  });

  it("applies default button class", () => {
    const { container } = render(() => (
      <Button
        onClick={() => {
          //
        }}
        text="Hello"
      />
    ));

    const button = container.querySelector("button");
    expect(button).not.toHaveClass("button");
  });

  it("applies custom class when class prop is provided", () => {
    const { container } = render(() => (
      <Button
        onClick={() => {
          //
        }}
        text="Hello"
        class="custom-class"
      />
    ));

    const button = container.querySelector("button");
    expect(button).toHaveClass("custom-class");
  });

  it("renders children content", () => {
    const { container } = render(() => (
      <Button
        onClick={() => {
          //
        }}
      >
        <span data-testid="child">Child</span>
      </Button>
    ));

    const child = container.querySelector('[data-testid="child"]');
    expect(child).toBeTruthy();
    expect(child).toHaveTextContent("Child");
  });

  it("applies balloon to button with default position", () => {
    const { container } = render(() => (
      <Button
        onClick={() => {
          //
        }}
        text="Hello"
        balloon={{ text: "test" }}
      />
    ));

    const button = container.querySelector("button");
    expect(button).toHaveAttribute("aria-label", "test");
    expect(button).toHaveAttribute("data-balloon-pos", "up");
  });

  it("applies balloon to button with custom position", () => {
    const { container } = render(() => (
      <Button
        onClick={() => {
          //
        }}
        text="Hello"
        balloon={{ text: "test", position: "down" }}
      />
    ));

    const button = container.querySelector("button");
    expect(button).toHaveAttribute("aria-label", "test");
    expect(button).toHaveAttribute("data-balloon-pos", "down");
  });

  it("applies balloon to anchor with default position", () => {
    const { container } = render(() => (
      <Button
        href="http://example.com"
        text="Hello"
        balloon={{ text: "test" }}
      />
    ));

    const anchor = container.querySelector("a");
    expect(anchor).toHaveAttribute("aria-label", "test");
    expect(anchor).toHaveAttribute("data-balloon-pos", "up");
  });

  it("applies balloon to anchor with custom position", () => {
    const { container } = render(() => (
      <Button
        href="http://example.com"
        text="Hello"
        balloon={{ text: "test", position: "down" }}
      />
    ));

    const anchor = container.querySelector("a");
    expect(anchor).toHaveAttribute("aria-label", "test");
    expect(anchor).toHaveAttribute("data-balloon-pos", "down");
  });

  it("renders a router link when to is provided", () => {
    const router = createTestRouter();

    const { container } = render(() => (
      <RouterContextProvider router={router}>
        {() => (
          <>
            <Button to="/settings" text="Settings" />
            <Button
              to="/profile/$uidOrName"
              params={{ uidOrName: "miodec" }}
              text="Profile"
            />
          </>
        )}
      </RouterContextProvider>
    ));

    const [settings, profile] = container.querySelectorAll("a");
    expect(settings).toHaveAttribute("href", "/settings");
    expect(settings).not.toHaveAttribute("target");
    expect(settings).toHaveAttribute("data-ui-element", "button");
    expect(profile).toHaveAttribute("href", "/profile/miodec");
  });

  it("renders a router link with search params in its href", () => {
    const router = createTestRouter();

    const { container } = render(() => (
      <RouterContextProvider router={router}>
        {() => (
          <Button
            to="/leaderboards"
            search={{ type: "daily", mode2: "15" }}
            text="Leaderboards"
          />
        )}
      </RouterContextProvider>
    ));

    expect(container.querySelector("a")).toHaveAttribute(
      "href",
      "/leaderboards?type=daily&mode2=15",
    );
  });

  it("only accepts routes of the app router with their params", () => {
    const router = createTestRouter();

    const { container } = render(() => (
      <RouterContextProvider router={router}>
        {() => (
          <>
            {/* @ts-expect-error unknown route */}
            <Button to="/nope" text="Nope" />
            {/* @ts-expect-error missing params */}
            <Button to="/profile/$uidOrName" text="Profile" />
            <Button
              to="/profile/$uidOrName"
              // @ts-expect-error unknown param
              params={{ name: "miodec" }}
              text="Profile"
            />
          </>
        )}
      </RouterContextProvider>
    ));

    expect(container.querySelectorAll("a")).toHaveLength(3);
  });

  it("navigates on click, but leaves cmd/ctrl+click to the browser", async () => {
    const router = createTestRouter();
    await router.load();

    const { container } = render(() => (
      <RouterContextProvider router={router}>
        {() => <Button to="/settings" text="Settings" />}
      </RouterContextProvider>
    ));
    const link = container.querySelector("a") as HTMLAnchorElement;

    for (const modifier of ["metaKey", "ctrlKey"]) {
      const event = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        [modifier]: true,
      });
      link.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
      expect(router.state.location.pathname).toBe("/");
    }

    link.click();
    await vi.waitFor(() => {
      expect(router.state.location.pathname).toBe("/settings");
    });
  });

  it("marks the link to the current page as active", async () => {
    const router = createTestRouter("/leaderboards?type=daily");
    await router.load();

    const { container } = render(() => (
      <RouterContextProvider router={router}>
        {() => (
          <>
            <Button to="/" text="Test" />
            <Button to="/leaderboards" text="Leaderboards" />
            <Button to="/settings" text="Settings" />
          </>
        )}
      </RouterContextProvider>
    ));

    const [test, leaderboards, settings] = container.querySelectorAll("a");
    expect(test).not.toHaveAttribute("data-status");
    expect(leaderboards).toHaveAttribute("data-status", "active");
    expect(settings).not.toHaveAttribute("data-status");
  });

  it("does not mark a link to a parent path as active", async () => {
    const router = createTestRouter("/profile/miodec");
    await router.load();

    const { container } = render(() => (
      <RouterContextProvider router={router}>
        {() => (
          <>
            <Button to="/profile" text="Search" />
            <Button
              to="/profile/$uidOrName"
              params={{ uidOrName: "miodec" }}
              text="Profile"
            />
          </>
        )}
      </RouterContextProvider>
    ));

    const [search, profile] = container.querySelectorAll("a");
    expect(search).not.toHaveAttribute("data-status");
    expect(profile).toHaveAttribute("data-status", "active");
  });

  it("applies disabled to button", () => {
    const { container } = render(() => (
      <Button
        onClick={() => {
          /** */
        }}
        text="Hello"
        disabled={true}
      />
    ));

    const button = container.querySelector("button");
    expect(button).toBeDisabled();
  });
});

function createTestRouter(path = "/"): AnyRouter {
  const root = createRootRoute();
  return createRouter({
    routeTree: root.addChildren([
      createRoute({ getParentRoute: () => root, path: "/" }),
      createRoute({ getParentRoute: () => root, path: "/settings" }),
      createRoute({ getParentRoute: () => root, path: "/leaderboards" }),
      createRoute({ getParentRoute: () => root, path: "/profile" }),
      createRoute({
        getParentRoute: () => root,
        path: "/profile/$uidOrName",
      }),
    ]),
    history: createMemoryHistory({ initialEntries: [path] }),
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
