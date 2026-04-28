import { describe, it, expect, beforeEach, vi } from "vitest";
import * as PresetController from "../../src/ts/controllers/preset-controller";
import { Preset } from "@monkeytype/schemas/presets";
import * as DB from "../../src/ts/db";
import { setConfig } from "../../src/ts/config/setters";
import { Config } from "../../src/ts/config/store";
import * as Lifecycle from "../../src/ts/config/lifecycle";
import * as ConfigUtils from "../../src/ts/config/utils";
import * as Persistence from "../../src/ts/config/persistence";
import * as Notifications from "../../src/ts/states/notifications";
import * as TestLogic from "../../src/ts/test/test-logic";
import * as Tags from "../../src/ts/collections/tags";

describe("PresetController", () => {
  describe("apply", () => {
    vi.mock("../../src/ts/test/test-logic", () => ({
      restart: vi.fn(),
    }));
    vi.mock("../../src/ts/test/pace-caret", () => ({
      //
    }));
    const dbGetSnapshotMock = vi.spyOn(DB, "getSnapshot");
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
    const testRestartMock = vi.spyOn(TestLogic, "restart");
    const tagsClearMock = vi.spyOn(Tags, "clearActiveTags");
    const tagsSetMock = vi.spyOn(Tags, "setTagActive");
    const tagsSaveActiveMock = vi.spyOn(Tags, "saveActiveToLocalStorage");

    beforeEach(() => {
      [
        dbGetSnapshotMock,
        configApplyMock,
        configSaveFullConfigMock,
        configGetConfigChangesMock,
        notificationAddMock,
        testRestartMock,
        tagsClearMock,
        tagsSetMock,
        tagsSaveActiveMock,
      ].forEach((it) => it.mockClear());

      configApplyMock.mockResolvedValue();
    });

    it("should apply for full preset", async () => {
      //GIVEN
      const preset = givenPreset({ config: { punctuation: true } });

      //WHEN
      await PresetController.apply(preset._id);

      //THEN
      expect(configApplyMock).toHaveBeenCalledWith(preset.config);
      expect(tagsClearMock).toHaveBeenCalled();
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
      expect(tagsClearMock).toHaveBeenCalled();
      expect(tagsSetMock).toHaveBeenNthCalledWith(1, "tagOne", true, false);
      expect(tagsSetMock).toHaveBeenNthCalledWith(2, "tagTwo", true, false);
      expect(tagsSaveActiveMock).toHaveBeenCalled();
    });

    it("should ignore unknown preset", async () => {
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
      expect(tagsClearMock).toHaveBeenCalled();
      expect(tagsSetMock).toHaveBeenNthCalledWith(1, "tagOne", true, false);
      expect(tagsSetMock).toHaveBeenNthCalledWith(2, "tagTwo", true, false);
      expect(tagsSaveActiveMock).toHaveBeenCalled();
    });

    const givenPreset = (partialPreset: Partial<Preset>): Preset => {
      const preset: Preset = {
        _id: "1",
        ...partialPreset,
      } as any;
      dbGetSnapshotMock.mockReturnValue({ presets: [preset] } as any);
      return preset;
    };
  });
});
