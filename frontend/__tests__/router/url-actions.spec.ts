import { describe, it, expect, beforeEach, vi } from "vitest";
import { Difficulty, Mode, Mode2 } from "@monkeytype/schemas/shared";
import { compressToURI } from "lz-ts";
import * as UpdateConfig from "../../src/ts/config/setters";
import * as Notifications from "../../src/ts/states/notifications";
import * as TestLogic from "../../src/ts/test/test-logic";
import * as TestState from "../../src/ts/states/test";
import { FunboxName } from "@monkeytype/schemas/configs";
import { CustomTextSettings } from "@monkeytype/schemas/results";
import {
  applyUrlActions,
  loadTestSettingsFromUrl,
} from "../../src/ts/router/url-actions";

//mock modules to avoid dependencies
vi.mock("../../src/ts/test/test-logic", () => ({
  restart: vi.fn(),
}));
vi.mock("../../src/ts/ape", () => ({
  default: {
    users: {
      linkDiscord: vi.fn(async () => ({
        status: 200,
        body: { message: "linked", data: {} },
      })),
    },
  },
}));

describe("url-actions", () => {
  describe("applyUrlActions", () => {
    const setConfigMock = vi.spyOn(UpdateConfig, "setConfig");

    beforeEach(() => {
      setConfigMock.mockClear();
    });

    function location(
      searchStr: string,
      hash = "",
    ): Parameters<typeof applyUrlActions>[0] {
      return {
        search: Object.fromEntries(new URLSearchParams(searchStr)),
        searchStr,
        hash,
      };
    }

    it("returns undefined without actions", () => {
      expect(applyUrlActions(location("?foo=1", "top"))).toBeUndefined();
      expect(setConfigMock).not.toHaveBeenCalled();
    });

    it("drops the action params and keeps the rest", () => {
      const rest = applyUrlActions(
        location(
          `?testSettings=${urlData({ punctuation: true })}&foo=1`,
          "top",
        ),
      );

      expect(rest).toEqual({ search: { foo: "1" }, hash: "top" });
      expect(setConfigMock).toHaveBeenCalledWith("punctuation", true, {
        nosave: true,
      });
    });

    it("reads values from the raw search, keeping their +", () => {
      const colors = new Array(10).fill("#111111");
      const theme = btoa(
        JSON.stringify({
          c: colors,
          i: "https://a.b/x~.png",
          s: "cover",
          f: [0, 1, 1, 1],
        }),
      );
      expect(theme).toContain("+");

      applyUrlActions(location(`?customTheme=${theme}`));

      expect(setConfigMock).toHaveBeenCalledWith("customThemeColors", colors);
    });

    it("drops the hash of a discord oauth redirect", () => {
      const rest = applyUrlActions(
        location("?foo=1", "access_token=a&token_type=b&state=c"),
      );

      expect(rest).toEqual({ search: { foo: "1" }, hash: "" });
    });
  });

  describe("loadTestSettingsFromUrl", () => {
    let url = "";

    const setConfigMock = vi.spyOn(UpdateConfig, "setConfig");
    const setSelectedQuoteIdMock = vi.spyOn(TestState, "setSelectedQuoteId");
    const restartTestMock = vi.spyOn(TestLogic, "restart");
    const notifySuccessMock = vi.spyOn(
      Notifications,
      "showSuccessNotification",
    );
    const notifyMock = vi.spyOn(Notifications, "showNoticeNotification");

    beforeEach(() => {
      [
        setConfigMock,
        setSelectedQuoteIdMock,
        restartTestMock,
        notifySuccessMock,
        notifyMock,
      ].forEach((it) => it.mockClear());

      url = "";
    });

    it("handles null", () => {
      //GIVEN
      url = "null";

      //WHEN
      loadTestSettingsFromUrl(url);

      //THEN
      expect(setConfigMock).not.toHaveBeenCalled();
    });
    it("handles mode2 as number", () => {
      //GIVEN
      url = urlData({ mode: "time", mode2: 60 });

      //WHEN
      loadTestSettingsFromUrl(url);

      //THEN
      expect(setConfigMock).toHaveBeenCalledWith("mode", "time", {
        nosave: true,
      });
      expect(setConfigMock).toHaveBeenCalledWith("time", 60, {
        nosave: true,
      });
      expect(restartTestMock).toHaveBeenCalled();
    });
    it("sets time", () => {
      //GIVEN
      url = urlData({ mode: "time", mode2: "30" });

      //WHEN
      loadTestSettingsFromUrl(url);

      //THEN
      expect(setConfigMock).toHaveBeenCalledWith("mode", "time", {
        nosave: true,
      });
      expect(setConfigMock).toHaveBeenCalledWith("time", 30, {
        nosave: true,
      });
      expect(restartTestMock).toHaveBeenCalled();
    });
    it("sets word count", () => {
      //GIVEN
      url = urlData({ mode: "words", mode2: "50" });

      //WHEN
      loadTestSettingsFromUrl(url);

      //THEN
      expect(setConfigMock).toHaveBeenCalledWith("mode", "words", {
        nosave: true,
      });
      expect(setConfigMock).toHaveBeenCalledWith("words", 50, {
        nosave: true,
      });
      expect(restartTestMock).toHaveBeenCalled();
    });
    it("sets quote length", () => {
      //GIVEN
      url = urlData({ mode: "quote", mode2: "512" });

      //WHEN
      loadTestSettingsFromUrl(url);

      //THEN
      expect(setConfigMock).toHaveBeenCalledWith("mode", "quote", {
        nosave: true,
      });
      expect(setConfigMock).toHaveBeenCalledWith("quoteLength", [-2]);
      expect(setSelectedQuoteIdMock).toHaveBeenCalledWith(512);
      expect(restartTestMock).toHaveBeenCalled();
    });
    it("sets punctuation", () => {
      //GIVEN
      url = urlData({ punctuation: true });

      //WHEN
      loadTestSettingsFromUrl(url);

      //THEN
      expect(setConfigMock).toHaveBeenCalledWith("punctuation", true, {
        nosave: true,
      });
      expect(restartTestMock).toHaveBeenCalled();
    });
    it("sets numbers", () => {
      //GIVEN
      url = urlData({ numbers: false });

      //WHEN
      loadTestSettingsFromUrl(url);

      //THEN
      expect(setConfigMock).toHaveBeenCalledWith("numbers", false, {
        nosave: true,
      });
      expect(restartTestMock).toHaveBeenCalled();
    });
    it("sets language", () => {
      //GIVEN
      url = urlData({ language: "english" });

      //WHEN
      loadTestSettingsFromUrl(url);

      //THEN
      expect(setConfigMock).toHaveBeenCalledWith("language", "english", {
        nosave: true,
      });
      expect(restartTestMock).toHaveBeenCalled();
    });
    it("sets difficulty", () => {
      //GIVEN
      url = urlData({ difficulty: "master" });

      //WHEN
      loadTestSettingsFromUrl(url);

      //THEN
      expect(setConfigMock).toHaveBeenCalledWith("difficulty", "master", {
        nosave: true,
      });
      expect(restartTestMock).toHaveBeenCalled();
    });
    it("sets funbox", () => {
      //GIVEN
      url = urlData({ funbox: ["crt", "choo_choo"] });

      //WHEN
      loadTestSettingsFromUrl(url);

      //THEN
      expect(setConfigMock).toHaveBeenCalledWith(
        "funbox",
        ["crt", "choo_choo"],
        {
          nosave: true,
        },
      );
      expect(restartTestMock).toHaveBeenCalled();
    });
    it("sets funbox legacy", () => {
      //GIVEN
      url = urlData({ funbox: "crt#choo_choo" });

      //WHEN
      loadTestSettingsFromUrl(url);

      //THEN
      expect(setConfigMock).toHaveBeenCalledWith(
        "funbox",
        ["crt", "choo_choo"],
        {
          nosave: true,
        },
      );
      expect(restartTestMock).toHaveBeenCalled();
    });
    it("adds notification", () => {
      //GIVEN
      url = urlData({
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
        funbox: ["ascii", "crt"],
      });

      //WHEN
      loadTestSettingsFromUrl(url);

      //THEN
      expect(notifySuccessMock).toHaveBeenCalledWith(expect.anything(), {
        durationMs: 10000,
        useInnerHtml: true,
      });
    });
    it("rejects invalid values", () => {
      //GIVEN
      url = urlData({
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
      } as any);

      //WHEN
      loadTestSettingsFromUrl(url);

      //THEN
      expect(notifyMock).toHaveBeenCalledWith(
        `Failed to load test settings from URL: JSON does not match schema: "0" invalid enum value. expected 'time' | 'words' | 'quote' | 'custom' | 'zen', received 'invalidmode', "1" needs to be a number or a number represented as a string e.g. "10"., "2.mode" invalid enum value. expected 'repeat' | 'random' | 'shuffle', received 'invalid', "2.pipeDelimiter" expected boolean, received string, "2.limit" expected object, received string, "2.text" expected array, received string, "3" expected boolean, received string, "4" expected boolean, received string, "6" invalid enum value. expected 'normal' | 'expert' | 'master', received 'invalid', "7" invalid input`,
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
    funbox: FunboxName[] | string;
  }>,
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
    ]),
  );
};
