// static json (layouts...) read from disk, the test state module loads some
import "../../../../__harness__/mock-static";
import { render } from "@solidjs/testing-library";
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
import { setIsLongTest } from "../../../../../src/ts/states/test";
import { setWordsInfo } from "../../../../../src/ts/test/engine/state";

function setWordsHave(has: { tab?: boolean; newline?: boolean }): void {
  setWordsInfo({
    hasTab: has.tab ?? false,
    hasNewline: has.newline ?? false,
    hasNumbers: false,
    hasKorean: false,
  });
}

describe("ResultButtons", () => {
  describe("tab with quick restart off", () => {
    beforeEach(() => {
      setConfigStore("quickRestart", "off");
      restartMock.mockClear();
    });

    afterEach(() => {
      setIsLongTest(false);
      setWordsHave({});
    });

    it.each([
      { name: "short test", setup: () => undefined },
      { name: "long test", setup: () => setIsLongTest(true) },
      { name: "words have tab", setup: () => setWordsHave({ tab: true }) },
      {
        name: "words have newline",
        setup: () => setWordsHave({ newline: true }),
      },
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
});
