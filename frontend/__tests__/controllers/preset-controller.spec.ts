import { describe, it, expect, beforeEach, vi } from "vitest";
import * as PresetController from "../../src/ts/controllers/preset-controller";
import { Preset } from "@monkeytype/schemas/presets";
import * as UserState from "../../src/ts/queries/user";
import { setConfig } from "../../src/ts/config/setters";
import { Config } from "../../src/ts/config/store";
import * as Lifecycle from "../../src/ts/config/lifecycle";
import * as ConfigUtils from "../../src/ts/config/utils";
import * as Persistence from "../../src/ts/config/persistence";
import * as Notifications from "../../src/ts/states/notifications";
import * as TestLogic from "../../src/ts/test/test-logic";
import * as Tags from "../../src/ts/queries/tags";
import * as Presets from "../../src/ts/collections/presets";

describe("PresetController", () => {
  describe("apply", () => {
    vi.mock("../../src/ts/test/test-logic", () => ({
      restartTest: vi.fn(),
    }));
    vi.mock("../../src/ts/test/pace-caret", () => ({
      //
    }));
    const getUserMock = vi.spyOn(UserState, "getUserData");
    const getPresetMock = vi.spyOn(Presets.__nonReactive, "getPreset");
    const configApplyMock = vi.spyOn(Lifecycle, "applyConfig");
    const configSaveFullConfigMock = vi.spyOn(
      Persistence,
      "saveFullConfigToLocalStorage",
    );
    const configGetConfigChangesMock = vi.spyOn(
      ConfigUtils,
      "getConfigChanges",
    );
    const notificationAddMock = vi.spyOn(
      Notifications,
      "showSuccessNotification",
    );
    const testRestartMock = vi.spyOn(TestLogic, "restartTest");
    const tagsSetMock = vi.spyOn(Tags, "setActiveTags");

    beforeEach(() => {
      [
        getUserMock,
        getPresetMock,
        configApplyMock,
        configSaveFullConfigMock,
        configGetConfigChangesMock,
        notificationAddMock,
        testRestartMock,
        tagsSetMock,
      ].forEach((it) => it.mockClear());

      getUserMock.mockReturnValue({} as any);
      configApplyMock.mockResolvedValue();
    });

    it("should apply for full preset", async () => {
      //GIVEN
      const preset = givenPreset({ config: { punctuation: true } });

      //WHEN
      await PresetController.apply(preset._id);

      //THEN
      expect(configApplyMock).toHaveBeenCalledWith(preset.config);
      expect(tagsSetMock).toHaveBeenCalledWith([]);
      expect(testRestartMock).toHaveBeenCalled();
      expect(notificationAddMock).toHaveBeenCalledWith("Preset applied", {
        durationMs: 2000,
      });
      expect(configSaveFullConfigMock).toHaveBeenCalled();
    });

    it("should apply for full preset with tags", async () => {
      //GIVEN
      const preset = givenPreset({
        config: { tags: ["tagOne", "tagTwo"] },
      });

      //WHEN
      await PresetController.apply(preset._id);

      //THEN
      expect(tagsSetMock).toHaveBeenCalledExactlyOnceWith(["tagOne", "tagTwo"]);
    });

    it("should ignore unknown preset", async () => {
      //GIVEN
      getPresetMock.mockReturnValue(undefined);

      //WHEN
      await PresetController.apply("unknown");
      //THEN
      expect(notificationAddMock).not.toHaveBeenCalled();
      expect(configApplyMock).not.toHaveBeenCalled();
    });

    it("should apply for partial preset", async () => {
      //GIVEN
      const preset = givenPreset({
        config: { punctuation: true },
        settingGroups: ["test"],
      });

      setConfig("numbers", true);
      const oldConfig = structuredClone(Config);

      //WHEN
      await PresetController.apply(preset._id);

      //THEN
      expect(configApplyMock).toHaveBeenCalledWith({
        ...oldConfig,
        numbers: true,
        punctuation: true,
      });
      expect(testRestartMock).toHaveBeenCalled();
      expect(notificationAddMock).toHaveBeenCalledWith("Preset applied", {
        durationMs: 2000,
      });
      expect(configSaveFullConfigMock).toHaveBeenCalled();
    });

    it("should apply for partial preset with tags", async () => {
      //GIVEN
      const preset = givenPreset({
        config: { tags: ["tagOne", "tagTwo"] },
        settingGroups: ["test", "behavior"],
      });

      //WHEN
      await PresetController.apply(preset._id);

      //THEN
      expect(tagsSetMock).toHaveBeenCalledExactlyOnceWith(["tagOne", "tagTwo"]);
    });

    const givenPreset = (partialPreset: Partial<Preset>): Preset => {
      const preset: Preset = {
        _id: "1",
        ...partialPreset,
      } as any;
      getUserMock.mockReturnValue({} as any);
      getPresetMock.mockReturnValue(preset);
      return preset;
    };
  });
});
