import { describe, it, expect } from "vitest";
import {
  canSetConfigWithCurrentFunboxes,
  getFunboxUnsupportedReason,
} from "../../../src/ts/config/funbox-validation";

import { FunboxName } from "@monkeytype/schemas/configs";
describe("funbox-validation", () => {
  describe("canSetConfigWithCurrentFunboxes", () => {
    const testCases = [
      //checks for frontendForcedConfig
      {
        key: "mode",
        value: "zen",
        funbox: ["memory"],
        expected: false,
      },
      { key: "mode", value: "words", funbox: ["memory"], expected: true },

      //checks for zen mode
      ...[
        "58008", //getWord
        "wikipedia", //pullSection
        "morse", //alterText
        "polyglot", //withWords
        "rAnDoMcAsE", //changesCapitalisation
        "nospace", //nospace
        "plus_one", //toPush:
        "read_ahead_easy", //changesWordVisibility
        "tts", //speaks
        "layout_mirror", //changesLayout
        "zipf", //changesWordsFrequency
      ].map((funbox) => ({
        key: "mode",
        value: "zen",
        funbox: [funbox],
        expected: false,
      })),
      { key: "mode", value: "zen", funbox: ["mirror"], expected: true },
      {
        key: "mode",
        value: "zen",
        funbox: ["space_balls"],
        expected: true,
      },

      //checks for words and custom
      ...["quote", "custom"].flatMap((value) =>
        [
          "58008", //getWord
          "wikipedia", //pullSection
          "polyglot", //withWords
          "zipf", //changesWordsFrequency
        ].map((funbox) => ({
          key: "mode",
          value,
          funbox: [funbox],
          expected: false,
        })),
      ),
      {
        key: "mode",
        value: "quote",
        funbox: ["space_balls"],
        expected: true,
      },
    ];
    it.for(testCases)(
      `check $funbox with $key=$value`,
      ({ key, value, funbox, expected }) => {
        expect(
          canSetConfigWithCurrentFunboxes(key, value, funbox as FunboxName[]),
        ).toBe(expected);
      },
    );
  });
  describe("getFunboxUnsupportedReason", () => {
    const safari165 =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15";
    const safari17 =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
    const chrome =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    it("blocks crt on Safari 16.5 or earlier", () => {
      expect(getFunboxUnsupportedReason("crt", safari165)).toBeDefined();
    });
    it.each([safari17, chrome])("allows crt on %s", (userAgent) => {
      expect(getFunboxUnsupportedReason("crt", userAgent)).toBeUndefined();
    });
    it("allows other funboxes on Safari 16.5", () => {
      expect(getFunboxUnsupportedReason("nausea", safari165)).toBeUndefined();
    });
  });
});
