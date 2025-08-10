import * as PresetController from "../../src/ts/controllers/preset-controller";
import { Preset } from "@monkeytype/schemas/presets";
import * as DB from "../../src/ts/db";
import * as UpdateConfig from "../../src/ts/config";
import * as Notifications from "../../src/ts/elements/notifications";
import * as TestLogic from "../../src/ts/test/test-logic";
import * as TagController from "../../src/ts/controllers/tag-controller";
import { deepClone } from "../../src/ts/utils/misc";

describe("PresetController", () => {
  describe("apply", () => {
    vi.mock("../../src/ts/test/test-logic", () => ({
      restart: vi.fn(),
    }));
    const dbGetSnapshotMock = vi.spyOn(DB, "getSnapshot");
    const configApplyMock = vi.spyOn(UpdateConfig, "apply");
    const configSaveFullConfigMock = vi.spyOn(
      UpdateConfig,
      "saveFullConfigToLocalStorage"
    );
    const configGetConfigChangesMock = vi.spyOn(
      UpdateConfig,
      "getConfigChanges"
    );
    const notificationAddMock = vi.spyOn(Notifications, "add");
    const testRestartMock = vi.spyOn(TestLogic, "restart");
    const tagControllerClearMock = vi.spyOn(TagController, "clear");
    const tagControllerSetMock = vi.spyOn(TagController, "set");
    const tagControllerSaveActiveMock = vi.spyOn(
      TagController,
      "saveActiveToLocalStorage"
    );

    beforeEach(() => {
      [
        dbGetSnapshotMock,
        configApplyMock,
        configSaveFullConfigMock,
        configGetConfigChangesMock,
        notificationAddMock,
        testRestartMock,
        tagControllerClearMock,
        tagControllerSetMock,
        tagControllerSaveActiveMock,
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
      expect(tagControllerClearMock).toHaveBeenCalled();
      expect(testRestartMock).toHaveBeenCalled();
      expect(notificationAddMock).toHaveBeenCalledWith("Preset applied", 1, {
        duration: 2,
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
      expect(tagControllerClearMock).toHaveBeenCalled();
      expect(tagControllerSetMock).toHaveBeenNthCalledWith(
        1,
        "tagOne",
        true,
        false
      );
      expect(tagControllerSetMock).toHaveBeenNthCalledWith(
        2,
        "tagTwo",
        true,
        false
      );
      expect(tagControllerSaveActiveMock).toHaveBeenCalled();
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

      UpdateConfig.setNumbers(true);
      const oldConfig = deepClone(UpdateConfig.default);

      //WHEN
      await PresetController.apply(preset._id);

      //THEN
      expect(configApplyMock).toHaveBeenCalledWith({
        ...oldConfig,
        numbers: true,
        punctuation: true,
      });
      expect(testRestartMock).toHaveBeenCalled();
      expect(notificationAddMock).toHaveBeenCalledWith("Preset applied", 1, {
        duration: 2,
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
      expect(tagControllerClearMock).toHaveBeenCalled();
      expect(tagControllerSetMock).toHaveBeenNthCalledWith(
        1,
        "tagOne",
        true,
        false
      );
      expect(tagControllerSetMock).toHaveBeenNthCalledWith(
        2,
        "tagTwo",
        true,
        false
      );
      expect(tagControllerSaveActiveMock).toHaveBeenCalled();
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
