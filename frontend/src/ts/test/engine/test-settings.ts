import { createMemo, createRoot } from "solid-js";
import { createStore, reconcile, unwrap } from "solid-js/store";
import { Config as ConfigType } from "@monkeytype/schemas/configs";
import { CustomTextSettings } from "@monkeytype/schemas/results";
import { Config } from "../../config/store";
import { getCustomTextIndicator } from "../../states/core";
import { getSelectedQuoteId } from "../../states/test";
import { canQuickRestart } from "../../utils/quick-restart";

/**
 * The config keys a test is generated with: the ones flagged
 * `changeRequiresRestart` in the config metadata, `true` or a function (a spec
 * checks they match).
 * Changing one restarts the test.
 */
export const TEST_SETTINGS_KEYS = [
  "punctuation",
  "numbers",
  "words",
  "time",
  "mode",
  "quoteLength",
  "language",
  "difficulty",
  "minWpm",
  "minWpmCustomSpeed",
  "minAcc",
  "minAccCustom",
  "minBurst",
  "minBurstCustomSpeed",
  "britishEnglish",
  "funbox",
  "customLayoutfluid",
  "customPolyglot",
  "strictSpace",
  "stopOnError",
  "lazyMode",
  "layout",
  "codeUnindentOnBackspace",
] as const satisfies readonly (keyof ConfigType)[];

export type TestSettingsKey = (typeof TEST_SETTINGS_KEYS)[number];

/**
 * The settings the current test was generated with. Everything that runs or
 * renders the test reads these, not live config, so a change shows only in
 * the next test: the old test fades out as it was.
 */
export type TestSettings = Pick<ConfigType, TestSettingsKey> & {
  customText: CustomTextSettings;
  selectedQuoteId: number;
};

// plain copies: config values are store proxies, and the snapshot must not
// follow later writes
function copy<T>(value: T): T {
  return structuredClone(unwrap(value));
}

function snapshot(customText: CustomTextSettings): TestSettings {
  const config = Object.fromEntries(
    TEST_SETTINGS_KEYS.map((key) => [key, copy(Config[key])]),
  ) as Pick<ConfigType, TestSettingsKey>;
  return {
    ...config,
    customText: copy(customText),
    selectedQuoteId: getSelectedQuoteId(),
  };
}

// until the first restart takes them (every test starts with one)
const [testSettings, setTestSettings] = createStore<TestSettings>({
  ...(Object.fromEntries(
    TEST_SETTINGS_KEYS.map((key) => [key, copy(Config[key])]),
  ) as Pick<ConfigType, TestSettingsKey>),
  customText: {
    text: [],
    mode: "repeat",
    limit: { mode: "word", value: 0 },
    pipeDelimiter: false,
  },
  selectedQuoteId: 1,
});

/** The settings the current test was generated with. Reactive. */
export function getTestSettings(): Readonly<TestSettings> {
  return testSettings;
}

/**
 * The restart's generation only (test-logic init): retakes the test settings
 * from config and the custom text, right before the words are generated.
 */
export function takeTestSettings(customText: CustomTextSettings): void {
  setTestSettings(reconcile(snapshot(customText)));
}

/**
 * The current test is long, too long to quick restart (eg. 1000+ words, 15+
 * minutes, a long custom text): restarting it asks for more. Reactive.
 */
export const isLongTest = createRoot(() =>
  createMemo(
    () =>
      !canQuickRestart(
        testSettings.mode,
        testSettings.words,
        testSettings.time,
        testSettings.customText,
        getCustomTextIndicator()?.isLong ?? false,
      ),
  ),
);
