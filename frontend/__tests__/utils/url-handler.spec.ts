import { Difficulty, Mode, Mode2 } from "@monkeytype/contracts/schemas/shared";
import { compressToURI } from "lz-ts";
import * as UpdateConfig from "../../src/ts/config";
import * as Notifications from "../../src/ts/elements/notifications";
import { CustomTextSettings } from "../../src/ts/test/custom-text";
import * as TestLogic from "../../src/ts/test/test-logic";
import * as TestState from "../../src/ts/test/test-state";
import * as Misc from "../../src/ts/utils/misc";
import { loadTestSettingsFromUrl } from "../../src/ts/utils/url-handler";

//mock modules to avoid dependencies
vi.mock("../../src/ts/test/test-logic", () => ({
  restart: vi.fn(),
}));

describe("url-handler", () => {
  describe("loadTestSettingsFromUrl", () => {
    const findGetParameterMock = vi.spyOn(Misc, "findGetParameter");

    const setModeMock = vi.spyOn(UpdateConfig, "setMode");
    const setTimeConfigMock = vi.spyOn(UpdateConfig, "setTimeConfig");
    const setWordCountMock = vi.spyOn(UpdateConfig, "setWordCount");
    const setQuoteLengthMock = vi.spyOn(UpdateConfig, "setQuoteLength");
    const setSelectedQuoteIdMock = vi.spyOn(TestState, "setSelectedQuoteId");
    const setPunctuationMock = vi.spyOn(UpdateConfig, "setPunctuation");
    const setNumbersMock = vi.spyOn(UpdateConfig, "setNumbers");
    const setLanguageMock = vi.spyOn(UpdateConfig, "setLanguage");
    const setDifficultyMock = vi.spyOn(UpdateConfig, "setDifficulty");
    const setFunboxMock = vi.spyOn(UpdateConfig, "setFunbox");

    const restartTestMock = vi.spyOn(TestLogic, "restart");
    const addNotificationMock = vi.spyOn(Notifications, "add");

    beforeEach(() => {
      [
        findGetParameterMock,
        setModeMock,
        setTimeConfigMock,
        setWordCountMock,
        setQuoteLengthMock,
        setSelectedQuoteIdMock,
        setPunctuationMock,
        setNumbersMock,
        setLanguageMock,
        setDifficultyMock,
        setFunboxMock,
        restartTestMock,
        addNotificationMock,
      ].forEach((it) => it.mockReset());

      findGetParameterMock.mockImplementation((override) => override);
    });
    afterEach(() => {});

    it("handles null", () => {
      //GIVEN
      findGetParameterMock.mockReturnValue("null");

      //WHEN
      loadTestSettingsFromUrl("");

      //THEN
      expect(setModeMock).not.toHaveBeenCalled();
    });
    it("handles mode2 as number", () => {
      //GIVEN
      findGetParameterMock.mockReturnValue(
        urlData({ mode: "time", mode2: 60 })
      );

      //WHEN
      loadTestSettingsFromUrl("");

      //THEN
      expect(setModeMock).toHaveBeenCalledWith("time", true);
      expect(setTimeConfigMock).toHaveBeenCalledWith(60, true);
      expect(restartTestMock).toHaveBeenCalled();
    });
    it("sets time", () => {
      //GIVEN
      findGetParameterMock.mockReturnValue(
        urlData({ mode: "time", mode2: "30" })
      );

      //WHEN
      loadTestSettingsFromUrl("");

      //THEN
      expect(setModeMock).toHaveBeenCalledWith("time", true);
      expect(setTimeConfigMock).toHaveBeenCalledWith(30, true);
      expect(restartTestMock).toHaveBeenCalled();
    });
    it("sets word count", () => {
      //GIVEN
      findGetParameterMock.mockReturnValue(
        urlData({ mode: "words", mode2: "50" })
      );

      //WHEN
      loadTestSettingsFromUrl("");

      //THEN
      expect(setModeMock).toHaveBeenCalledWith("words", true);
      expect(setWordCountMock).toHaveBeenCalledWith(50, true);
      expect(restartTestMock).toHaveBeenCalled();
    });
    it("sets quote length", () => {
      //GIVEN
      findGetParameterMock.mockReturnValue(
        urlData({ mode: "quote", mode2: "512" })
      );

      //WHEN
      loadTestSettingsFromUrl("");

      //THEN
      expect(setModeMock).toHaveBeenCalledWith("quote", true);
      expect(setQuoteLengthMock).toHaveBeenCalledWith(-2, false);
      expect(setSelectedQuoteIdMock).toHaveBeenCalledWith(512);
      expect(restartTestMock).toHaveBeenCalled();
    });
    it("sets punctuation", () => {
      //GIVEN
      findGetParameterMock.mockReturnValue(urlData({ punctuation: true }));

      //WHEN
      loadTestSettingsFromUrl("");

      //THEN
      expect(setPunctuationMock).toHaveBeenCalledWith(true, true);
      expect(restartTestMock).toHaveBeenCalled();
    });
    it("sets numbers", () => {
      //GIVEN
      findGetParameterMock.mockReturnValue(urlData({ numbers: false }));

      //WHEN
      loadTestSettingsFromUrl("");

      //THEN
      expect(setNumbersMock).toHaveBeenCalledWith(false, true);
      expect(restartTestMock).toHaveBeenCalled();
    });
    it("sets language", () => {
      //GIVEN
      findGetParameterMock.mockReturnValue(urlData({ language: "english" }));

      //WHEN
      loadTestSettingsFromUrl("");

      //THEN
      expect(setLanguageMock).toHaveBeenCalledWith("english", true);
      expect(restartTestMock).toHaveBeenCalled();
    });
    it("sets difficulty", () => {
      //GIVEN
      findGetParameterMock.mockReturnValue(urlData({ difficulty: "master" }));

      //WHEN
      loadTestSettingsFromUrl("");

      //THEN
      expect(setDifficultyMock).toHaveBeenCalledWith("master", true);
      expect(restartTestMock).toHaveBeenCalled();
    });
    it("sets funbox", () => {
      //GIVEN
      findGetParameterMock.mockReturnValue(
        urlData({ funbox: "crt#choo_choo" })
      );

      //WHEN
      loadTestSettingsFromUrl("");

      //THEN
      expect(setFunboxMock).toHaveBeenCalledWith("crt#choo_choo", true);
      expect(restartTestMock).toHaveBeenCalled();
    });
    it("adds notification", () => {
      //GIVEN
      findGetParameterMock.mockReturnValue(
        urlData({
          mode: "time",
          mode2: "60",
          customText: {
            text: ["abcabc"],
            limit: { value: 5, mode: "time" },
            mode: "random",
            pipeDelimiter: true,
          },
          punctuation: true,
          numbers: true,
          language: "english",
          difficulty: "master",
          funbox: "a#b",
        })
      );

      //WHEN
      loadTestSettingsFromUrl("");

      //THEN
      expect(addNotificationMock).toHaveBeenCalledWith(
        "Settings applied from URL:<br><br>mode: time<br>mode2: 60<br>custom text settings<br>punctuation: on<br>numbers: on<br>language: english<br>difficulty: master<br>funbox: a#b<br>",
        1,
        {
          duration: 10,
          allowHTML: true,
        }
      );
    });
    it("rejects invalid values", () => {
      //GIVEN
      findGetParameterMock.mockReturnValue(
        urlData({
          mode: "invalidMode",
          mode2: "invalidMode2",
          customText: {
            text: "invalid",
            limit: "invalid",
            mode: "invalid",
            pipeDelimiter: "invalid",
          },
          punctuation: "invalid",
          numbers: "invalid",
          language: "invalid",
          difficulty: "invalid",
          funbox: ["invalid"],
        } as any)
      );

      //WHEN
      loadTestSettingsFromUrl("");

      //THEN
      expect(addNotificationMock).toHaveBeenCalledWith(
        `Failed to load test settings from URL: \"0\" Invalid enum value. Expected 'time' | 'words' | 'quote' | 'custom' | 'zen', received 'invalidMode'
\"1\" Needs to be a number or a number represented as a string e.g. \"10\".
\"2.text\" Expected array, received string
\"2.mode\" Invalid enum value. Expected 'repeat' | 'random' | 'shuffle', received 'invalid'
\"2.limit\" Expected object, received string
\"2.pipeDelimiter\" Expected boolean, received string
\"3\" Expected boolean, received string
\"4\" Expected boolean, received string
\"6\" Invalid enum value. Expected 'normal' | 'expert' | 'master', received 'invalid'
\"7\" Expected string, received array`,
        0
      );
    });
  });
});

const urlData = (
  data: Partial<{
    mode: Mode | undefined;
    mode2: Mode2<any> | number;
    customText: CustomTextSettings;
    punctuation: boolean;
    numbers: boolean;
    language: string;
    difficulty: Difficulty;
    funbox: string;
  }>
): string => {
  return compressToURI(
    JSON.stringify([
      data.mode ?? null,
      data.mode2 ?? null,
      data.customText ?? null,
      data.punctuation ?? null,
      data.numbers ?? null,
      data.language ?? null,
      data.difficulty ?? null,
      data.funbox ?? null,
    ])
  );
};
