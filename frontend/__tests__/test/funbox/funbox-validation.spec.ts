import { describe, it, expect } from "vitest";
import { canSetConfigWithCurrentFunboxes } from "../../../src/ts/config/funbox-validation";

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
});
