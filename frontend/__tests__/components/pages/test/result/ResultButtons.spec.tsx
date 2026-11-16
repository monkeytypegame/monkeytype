// static json (layouts...) read from disk, the test state module loads some
import "../../../../__harness__/mock-static";
import { cleanup, render } from "@solidjs/testing-library";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { restartMock } = vi.hoisted(() => ({ restartMock: vi.fn() }));
vi.mock("../../../../../src/ts/test/test-logic", () => ({
  restartTest: restartMock,
  repeatTest: vi.fn(),
}));
vi.mock("../../../../../src/ts/states/router", () => ({
  getRoutePage: () => "test",
}));

import { ResultButtons } from "../../../../../src/ts/components/pages/test/result/ResultButtons";
import { setConfigStore } from "../../../../../src/ts/config/store";
import "../../../../../src/ts/input/hotkeys";
import {
  setIsLongTest,
  setWordsHaveNewline,
  setWordsHaveTab,
} from "../../../../../src/ts/states/test";

// as if the user left the tab (eg. opened another tab, then closed it):
// the browser drops focus to the body and returns it when they come back
// (jsdom: blurring the focused element leaves focus on the body)
function dropFocusToBody(): void {
  (document.activeElement as HTMLElement)?.blur();
  expect(document.activeElement).toBe(document.body);
}

describe("ResultButtons", () => {
  afterEach(() => {
    cleanup();
  });

  it("when result page is mounted, resultButtonsPrefocusTarget receives focus", () => {
    const { container } = render(() => <ResultButtons glarses={false} />);

    // the prefocus target has no id - it's the unfocusable-by-tab div first in the component
    const prefocusTarget = container.firstElementChild as HTMLElement;
    expect(prefocusTarget.tabIndex).toBe(-1);
    expect(document.activeElement).toBe(prefocusTarget);
  });

  describe("tab with quick restart off", () => {
    beforeEach(() => {
      setConfigStore("quickRestart", "off");
      restartMock.mockClear();
    });

    afterEach(() => {
      setIsLongTest(false);
      setWordsHaveTab(false);
      setWordsHaveNewline(false);
    });

    it.each([
      { name: "short test", setup: () => undefined },
      { name: "long test", setup: () => setIsLongTest(true) },
      { name: "words have tab", setup: () => setWordsHaveTab(true) },
      { name: "words have newline", setup: () => setWordsHaveNewline(true) },
    ])("focuses the next test button ($name)", async ({ setup }) => {
      setup();
      const { container } = render(() => <ResultButtons glarses={false} />);

      await userEvent.tab();

      expect(document.activeElement).toBe(
        container.querySelector('[data-ui-element="restartTestButton"]'),
      );
      expect(restartMock).not.toHaveBeenCalled();
    });
  });

  describe("tab with quick restart on tab", () => {
    beforeEach(() => {
      setConfigStore("quickRestart", "tab");
      restartMock.mockClear();
    });

    it("restarts the test", async () => {
      render(() => <ResultButtons glarses={false} />);

      await userEvent.tab();

      expect(restartMock).toHaveBeenCalledWith({ isQuickRestart: true });
    });
  });

  describe("after the browser dropped focus to the body (eg. a tab round trip)", () => {
    it("restores the prefocus when the window regains focus", () => {
      const { container } = render(() => <ResultButtons glarses={false} />);
      const prefocusTarget = container.firstElementChild as HTMLElement;

      dropFocusToBody();
      window.dispatchEvent(new FocusEvent("focus"));

      expect(document.activeElement).toBe(prefocusTarget);
    });

    it("restores the prefocus when the page becomes visible again", () => {
      const { container } = render(() => <ResultButtons glarses={false} />);
      const prefocusTarget = container.firstElementChild as HTMLElement;

      dropFocusToBody();
      document.dispatchEvent(new Event("visibilitychange"));

      expect(document.activeElement).toBe(prefocusTarget);
    });

    it("keeps focus on an element the user focused", () => {
      const { container } = render(() => <ResultButtons glarses={false} />);
      const button = container.querySelector<HTMLElement>(
        '[data-ui-element="restartTestButton"]',
      );
      button?.focus();

      window.dispatchEvent(new FocusEvent("focus"));
      document.dispatchEvent(new Event("visibilitychange"));

      expect(document.activeElement).toBe(button);
    });
  });
});
