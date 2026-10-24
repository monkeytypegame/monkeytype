// static json (layouts...) read from disk, the test state module loads some
import "../../../../__harness__/mock-static";
import { render } from "@solidjs/testing-library";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { restartMock } = vi.hoisted(() => ({ restartMock: vi.fn() }));
vi.mock("../../../../../src/ts/test/test-logic", () => ({
  restart: restartMock,
  repeatTest: vi.fn(),
}));
vi.mock("../../../../../src/ts/states/router", () => ({
  getRoutePage: () => "test",
}));

import { ResultButtons } from "../../../../../src/ts/components/pages/test/result/ResultButtons";
import { setConfigStore } from "../../../../../src/ts/config/store";
import { restartTestEvent } from "../../../../../src/ts/events/test";
import "../../../../../src/ts/input/hotkeys";
import {
  setIsLongTest,
  setWordsHaveNewline,
  setWordsHaveTab,
} from "../../../../../src/ts/states/test";

describe("ResultButtons", () => {
  it("when result page is mounted, resultButtonsPrefocusTarget receives focus", () => {
    const { container } = render(() => <ResultButtons glarses={false} />);

    // the prefocus target has no id - it's the unfocusable-by-tab div first in the component
    const prefocusTarget = container.firstElementChild as HTMLElement;
    expect(prefocusTarget.tabIndex).toBe(-1);
    expect(document.activeElement).toBe(prefocusTarget);
  });

  describe("tab with quick restart off", () => {
    const restartEventListener = vi.fn();
    let unsubscribe: () => void;

    beforeEach(() => {
      setConfigStore("quickRestart", "off");
      restartMock.mockClear();
      restartEventListener.mockClear();
      unsubscribe = restartTestEvent.subscribe(restartEventListener);
    });

    afterEach(() => {
      unsubscribe();
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
      expect(restartEventListener).not.toHaveBeenCalled();
      expect(restartMock).not.toHaveBeenCalled();
    });
  });
});
