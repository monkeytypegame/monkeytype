import { describe, it, expect, beforeEach, vi } from "vitest";
import { Difficulty, Mode, Mode2 } from "@monkeytype/schemas/shared";
import { compressToURI } from "lz-ts";
import * as UpdateConfig from "../../src/ts/config/setters";
import * as Notifications from "../../src/ts/states/notifications";
import * as TestLogic from "../../src/ts/test/test-logic";
import * as TestState from "../../src/ts/states/test";
import { FunboxName } from "@monkeytype/schemas/configs";
import { CustomTextSettings } from "@monkeytype/schemas/results";
import { readUrlAction } from "../../src/ts/url-actions/action";
import {
  SharedTestSettings,
  testSettingsAction,
  testSettingsLink,
} from "../../src/ts/url-actions/actions/test-settings";

function decodeTestSettings(value: string): SharedTestSettings {
  const read = readUrlAction(testSettingsAction, { testSettings: value });
  if (!read.success) throw new Error(read.error);
  return read.data;
}

const applyTestSettings = async (value: string): Promise<void> =>
  testSettingsAction.apply(decodeTestSettings(value));

const linkValue = (link: string): string => link.slice(link.indexOf("=") + 1);

//mock modules to avoid dependencies
vi.mock("../../src/ts/test/test-logic", () => ({
  restart: vi.fn(),
}));

describe("testSettingsLink", () => {
  it("decodes back to the same settings", () => {
    const settings: Parameters<typeof testSettingsLink>[0] = {
      mode: "custom",
      mode2: "15",
      customText: {
        text: ["a", "b+c"],
        mode: "random",
        limit: { mode: "word", value: 10 },
        pipeDelimiter: true,
      },
      punctuation: true,
      numbers: false,
      language: "english",
      difficulty: "expert",
      funbox: ["crt"],
    };

    expect(decodeTestSettings(linkValue(testSettingsLink(settings)))).toEqual(
      settings,
    );
  });

  it("leaves out settings that aren't shared", () => {
    expect(
      decodeTestSettings(linkValue(testSettingsLink({ numbers: true }))),
    ).toEqual({
      numbers: true,
    });
  });

  it("builds a link with the testSettings param", () => {
    expect(testSettingsLink({})).toBe(
      `${location.origin}?testSettings=${compressToURI(JSON.stringify(new Array(8).fill(null)))}`,
    );
  });
});

describe("reading testSettingsAction", () => {
  it("throws on an invalid value", () => {
    expect(() => decodeTestSettings("nope")).toThrow();
  });

  it("throws on null", () => {
    expect(() => decodeTestSettings(compressToURI("null"))).toThrow();
  });

  it("converts legacy custom text and funbox values", () => {
    const settings = decodeTestSettings(
      compressToURI(
        JSON.stringify([
          null,
          null,
          { text: ["a"], isWordRandom: true, word: 5, delimiter: "|" },
          null,
          null,
          null,
          null,
          "crt#choo_choo",
        ]),
      ),
    );

    expect(settings).toEqual({
      customText: {
        text: ["a"],
        mode: "repeat",
        limit: { mode: "word", value: 5 },
        pipeDelimiter: true,
      },
      funbox: ["crt", "choo_choo"],
    });
  });

  it("rejects invalid values", () => {
    const url = urlData({
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

    const read = readUrlAction(testSettingsAction, { testSettings: url });

    expect(read.success).toBe(false);
    // the issues' paths, eg. "testSettings.0" for the mode
    const paths = read.success
      ? []
      : [...read.error.matchAll(/"(testSettings[.\w]*)"/g)].map((m) => m[1]);
    expect(paths).toEqual([
      "testSettings.0",
      "testSettings.1",
      "testSettings.2.mode",
      "testSettings.2.pipeDelimiter",
      "testSettings.2.limit",
      "testSettings.2.text",
      "testSettings.3",
      "testSettings.4",
      "testSettings.6",
      "testSettings.7",
    ]);
  });
});

describe("testSettingsAction", () => {
  let url = "";

  const setConfigMock = vi.spyOn(UpdateConfig, "setConfig");
  const setSelectedQuoteIdMock = vi.spyOn(TestState, "setSelectedQuoteId");
  const restartTestMock = vi.spyOn(TestLogic, "restart");
  const notifySuccessMock = vi.spyOn(Notifications, "showSuccessNotification");

  beforeEach(() => {
    [
      setConfigMock,
      setSelectedQuoteIdMock,
      restartTestMock,
      notifySuccessMock,
    ].forEach((it) => it.mockClear());

    url = "";
  });

  it("handles mode2 as number", async () => {
    //GIVEN
    url = urlData({ mode: "time", mode2: 60 });

    //WHEN
    await applyTestSettings(url);

    //THEN
    expect(setConfigMock).toHaveBeenCalledWith("mode", "time", {
      nosave: true,
    });
    expect(setConfigMock).toHaveBeenCalledWith("time", 60, {
      nosave: true,
    });
    expect(restartTestMock).toHaveBeenCalled();
  });
  it("sets time", async () => {
    //GIVEN
    url = urlData({ mode: "time", mode2: "30" });

    //WHEN
    await applyTestSettings(url);

    //THEN
    expect(setConfigMock).toHaveBeenCalledWith("mode", "time", {
      nosave: true,
    });
    expect(setConfigMock).toHaveBeenCalledWith("time", 30, {
      nosave: true,
    });
    expect(restartTestMock).toHaveBeenCalled();
  });
  it("sets word count", async () => {
    //GIVEN
    url = urlData({ mode: "words", mode2: "50" });

    //WHEN
    await applyTestSettings(url);

    //THEN
    expect(setConfigMock).toHaveBeenCalledWith("mode", "words", {
      nosave: true,
    });
    expect(setConfigMock).toHaveBeenCalledWith("words", 50, {
      nosave: true,
    });
    expect(restartTestMock).toHaveBeenCalled();
  });
  it("sets quote length", async () => {
    //GIVEN
    url = urlData({ mode: "quote", mode2: "512" });

    //WHEN
    await applyTestSettings(url);

    //THEN
    expect(setConfigMock).toHaveBeenCalledWith("mode", "quote", {
      nosave: true,
    });
    expect(setConfigMock).toHaveBeenCalledWith("quoteLength", [-2]);
    expect(setSelectedQuoteIdMock).toHaveBeenCalledWith(512);
    expect(restartTestMock).toHaveBeenCalled();
  });
  it("sets punctuation", async () => {
    //GIVEN
    url = urlData({ punctuation: true });

    //WHEN
    await applyTestSettings(url);

    //THEN
    expect(setConfigMock).toHaveBeenCalledWith("punctuation", true, {
      nosave: true,
    });
    expect(restartTestMock).toHaveBeenCalled();
  });
  it("sets numbers", async () => {
    //GIVEN
    url = urlData({ numbers: false });

    //WHEN
    await applyTestSettings(url);

    //THEN
    expect(setConfigMock).toHaveBeenCalledWith("numbers", false, {
      nosave: true,
    });
    expect(restartTestMock).toHaveBeenCalled();
  });
  it("sets language", async () => {
    //GIVEN
    url = urlData({ language: "english" });

    //WHEN
    await applyTestSettings(url);

    //THEN
    expect(setConfigMock).toHaveBeenCalledWith("language", "english", {
      nosave: true,
    });
    expect(restartTestMock).toHaveBeenCalled();
  });
  it("sets difficulty", async () => {
    //GIVEN
    url = urlData({ difficulty: "master" });

    //WHEN
    await applyTestSettings(url);

    //THEN
    expect(setConfigMock).toHaveBeenCalledWith("difficulty", "master", {
      nosave: true,
    });
    expect(restartTestMock).toHaveBeenCalled();
  });
  it("sets funbox", async () => {
    //GIVEN
    url = urlData({ funbox: ["crt", "choo_choo"] });

    //WHEN
    await applyTestSettings(url);

    //THEN
    expect(setConfigMock).toHaveBeenCalledWith("funbox", ["crt", "choo_choo"], {
      nosave: true,
    });
    expect(restartTestMock).toHaveBeenCalled();
  });
  it("sets funbox legacy", async () => {
    //GIVEN
    url = urlData({ funbox: "crt#choo_choo" });

    //WHEN
    await applyTestSettings(url);

    //THEN
    expect(setConfigMock).toHaveBeenCalledWith("funbox", ["crt", "choo_choo"], {
      nosave: true,
    });
    expect(restartTestMock).toHaveBeenCalled();
  });
  it("adds notification", async () => {
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
    await applyTestSettings(url);

    //THEN
    expect(notifySuccessMock).toHaveBeenCalledWith(expect.anything(), {
      durationMs: 10000,
      useInnerHtml: true,
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
