import {
  ConfigKey,
  Config as ConfigType,
} from "@monkeytype/contracts/schemas/configs";
import * as Config from "../../src/ts/config";

type TestsByConfig<T> = Partial<{
  [K in keyof ConfigType]: (T & { value: ConfigType[K] })[];
}>;

const { configMetadata, replaceConfig, getConfig } = Config.__testing;

describe("Config", () => {
  describe("configMeta", () => {
    it("should have changeRequiresRestart defined", () => {
      const configsRequiringRestarts = Object.entries(configMetadata)
        .filter(([_key, value]) => value.changeRequiresRestart === true)
        .map(([key]) => key)
        .sort();

      expect(configsRequiringRestarts).toEqual(
        [
          "punctuation",
          "numbers",
          "words",
          "time",
          "mode",
          "quoteLength",
          "language",
          "difficulty",
          "minWpmCustomSpeed",
          "minWpm",
          "minAcc",
          "minAccCustom",
          "minBurst",
          "minBurstCustomSpeed",
          "britishEnglish",
          "funbox",
          "customLayoutfluid",
          "strictSpace",
          "stopOnError",
          "lazyMode",
          "layout",
          "codeUnindentOnBackspace",
        ].sort()
      );
    });

    it("should have triggerResize defined", () => {
      const configsWithTriggeResize = Object.entries(configMetadata)
        .filter(([_key, value]) => value.triggerResize === true)
        .map(([key]) => key)
        .sort();

      expect(configsWithTriggeResize).toEqual(
        ["fontSize", "keymapSize", "maxLineWidth", "tapeMode"].sort()
      );
    });

    describe("overrideValue", () => {
      const testCases: TestsByConfig<{
        given?: Partial<ConfigType>;
        expected: Partial<ConfigType>;
      }> = {
        punctuation: [
          { value: true, expected: { punctuation: true } },
          {
            value: true,
            given: { mode: "quote" },
            expected: { punctuation: false },
          },
        ],
      };

      it.for(
        Object.entries(testCases).flatMap(([key, value]) =>
          value.flatMap((it) => ({ key: key as ConfigKey, ...it }))
        )
      )(
        `$key value=$value given=$given expect=$expected`,
        ({ key, value, given, expected }) => {
          //GIVEN
          replaceConfig(given ?? {});

          //WHEN
          Config.genericSet(key, value as any);

          //THEN
          expect(getConfig()).toMatchObject(expected);
        }
      );
    });

    describe("isBlocked", () => {
      const testCases: TestsByConfig<{
        given?: Partial<ConfigType>;
        fail?: true;
      }> = {
        showAllLines: [
          { value: true, given: { tapeMode: "off" } },
          { value: false, given: { tapeMode: "word" } },
          { value: true, given: { tapeMode: "word" }, fail: true },
        ],
      };

      it.for(
        Object.entries(testCases).flatMap(([key, value]) =>
          value.flatMap((it) => ({ key: key as ConfigKey, ...it }))
        )
      )(
        `$key value=$value given=$given fail=$fail`,
        ({ key, value, given, fail }) => {
          //GIVEN
          replaceConfig(given ?? {});

          //WHEN
          const applied = Config.genericSet(key, value as any);

          //THEN
          expect(applied).toEqual(!fail);
        }
      );
    });

    describe("overrideConfig", () => {
      const testCases: TestsByConfig<{
        given: Partial<ConfigType>;
        expected?: Partial<ConfigType>;
      }> = {
        mode: [
          { value: "time", given: { numbers: true, punctuation: true } },
          {
            value: "custom",
            given: { numbers: true, punctuation: true },
            expected: { numbers: false, punctuation: false },
          },
          {
            value: "quote",
            given: { numbers: true, punctuation: true },
            expected: { numbers: false, punctuation: false },
          },
          {
            value: "zen",
            given: { numbers: true, punctuation: true },
            expected: { numbers: false, punctuation: false },
          },
        ],
      };

      it.for(
        Object.entries(testCases).flatMap(([key, value]) =>
          value.flatMap((it) => ({ key: key as ConfigKey, ...it }))
        )
      )(
        `$key value=$value given=$given expected=$expected`,
        ({ key, value, given, expected }) => {
          //GIVEN
          replaceConfig(given);

          //WHEN
          Config.genericSet(key, value as any);

          //THEN
          expect(getConfig()).toMatchObject(expected ?? {});
        }
      );
    });
  });
});
