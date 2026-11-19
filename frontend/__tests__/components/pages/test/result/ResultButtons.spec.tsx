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
import { __testing as configTesting } from "../../../../../src/ts/config/testing";
import "../../../../../src/ts/input/hotkeys";
import * as CustomText from "../../../../../src/ts/test/custom-text";
import { setWordsInfo } from "../../../../../src/ts/test/engine/state";
import { takeTestSettings } from "../../../../../src/ts/test/engine/test-settings";

/** The current test's length: a long one can't be quick restarted. */
function setLongTest(long: boolean): void {
  configTesting.replaceConfig({
    ...configTesting.getConfig(),
    mode: "words",
    words: long ? 1000 : 50,
  });
  takeTestSettings(CustomText.getData());
}

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
      setLongTest(false);
      setWordsHave({});
    });

    it.each([
      { name: "short test", setup: () => undefined },
      { name: "long test", setup: () => setLongTest(true) },
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
