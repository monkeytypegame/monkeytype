import { canSetConfigWithCurrentFunboxes } from "../../../src/ts/test/funbox/funbox-validation";

import * as Notifications from "../../../src/ts/elements/notifications";
import { FunboxName } from "@monkeytype/contracts/schemas/configs";
describe("funbox-validation", () => {
  describe("canSetConfigWithCurrentFunboxes", () => {
    const addNotificationMock = vi.spyOn(Notifications, "add");
    afterEach(() => {
      addNotificationMock.mockReset();
    });

    const testCases = [
      //checks for frontendForcedConfig
      {
        key: "mode",
        value: "zen",
        funbox: ["memory"],
        error: "You can't set mode to zen with currently active funboxes.",
      },
      { key: "mode", value: "words", funbox: ["memory"] }, //ok

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
        error: "You can't set mode to zen with currently active funboxes.",
      })),
      { key: "mode", value: "zen", funbox: ["mirror"] }, //ok
      { key: "mode", value: "zen", funbox: ["space_balls"] }, //no frontendFunctions

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
          error: `You can't set mode to ${value} with currently active funboxes.`,
        }))
      ),
      { key: "mode", value: "quote", funbox: ["space_balls"] }, //no frontendFunctions
    ];
    it.for(testCases)(
      `check $funbox with $key=$value`,
      ({ key, value, funbox, error }) => {
        expect(
          canSetConfigWithCurrentFunboxes(key, value, funbox as FunboxName[])
        ).toBe(error === undefined);

        if (error !== undefined) {
          expect(addNotificationMock).toHaveBeenCalledWith(error, 0, {
            duration: 5,
          });
        }
      }
    );
  });
});
