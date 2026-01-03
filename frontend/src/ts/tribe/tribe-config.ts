import Config, * as UpdateConfig from "../config";
import * as TribeConfigSyncEvent from "../observables/tribe-config-sync-event";
import * as TribeButtons from "./tribe-buttons";
import * as TribeState from "../tribe/tribe-state";
import tribeSocket from "./tribe-socket";
import * as TribeTypes from "./types";
import { debounce } from "throttle-debounce";
import { configMetadata } from "../config-metadata";
import * as CustomText from "../test/custom-text";
import { typedKeys } from "../utils/misc";

export function getConfigString(config: TribeTypes.RoomConfig): string {
  const ret: string[] = [];

  ret.push(config.mode);

  if (config.mode === "time") {
    ret.push(`${config.time}`);
  } else if (config.mode === "words") {
    ret.push(`${config.words}`);
  } else if (config.mode === "custom") {
    ret.push("custom");
  } else if (config.mode === "quote") {
    let quoteLengthString = "";
    if (config.quoteLength.length === 4) {
      quoteLengthString = "any";
    } else {
      config.quoteLength.forEach((ql: number) => {
        if (ql === 0) {
          quoteLengthString += "short,";
        } else if (ql === 1) {
          quoteLengthString += "medium,";
        } else if (ql === 2) {
          quoteLengthString += "long,";
        } else if (ql === 3) {
          quoteLengthString += "thicc,";
        }
      });
      quoteLengthString = quoteLengthString.substring(
        0,
        quoteLengthString.length - 1,
      );
    }
    ret.push(`${quoteLengthString}`);
  } else {
    ret.push("zen");
  }

  if (config.difficulty !== "normal") ret.push(config.difficulty);

  ret.push(config.language);

  if (config.punctuation) ret.push("punctuation");
  if (config.numbers) ret.push("numbers");
  if (config.funbox.length > 0) ret.push(config.funbox.join(","));
  if (config.lazyMode) ret.push("lazy mode");
  if (config.stopOnError !== "off") {
    ret.push("stop on " + (config.stopOnError === "word" ? "word" : "letter"));
  }
  if (config.minWpm !== "off") ret.push(`min ${config.minWpmCustomSpeed}wpm`);
  if (config.minAcc !== "off") ret.push(`min ${config.minAccCustom}% acc`);
  if (config.minBurst !== "off") {
    ret.push(`min ${config.minBurstCustomSpeed}wpm burst`);
  }

  return ret.join(" ");
}

export function isConfigInfinite(config: TribeTypes.RoomConfig): boolean {
  const timeModeInfinite = config.mode === "time" && config.time === 0;
  const wordsModeInfinite = config.mode === "words" && config.words === 0;
  const customModeInfinite =
    config.mode === "custom" &&
    ((config.customText.limit.mode === "time" &&
      config.customText.limit.value === 0) ||
      (config.customText.limit.mode === "word" &&
        config.customText.limit.value === 0) ||
      (config.customText.limit.mode === "section" &&
        config.customText.limit.value === 0));

  return timeModeInfinite || wordsModeInfinite || customModeInfinite;
}

export async function apply(config: TribeTypes.RoomConfig): Promise<void> {
  CustomText.setText(config.customText.text, true);

  const configToApply: Partial<typeof Config> = {};
  for (const key of typedKeys(Config)) {
    // @ts-expect-error this is ok
    if (config[key] !== undefined) {
      // @ts-expect-error this is ok
      // oxlint-disable-next-line no-unsafe-assignment
      configToApply[key] = config[key];
    } else {
      // @ts-expect-error this is ok
      // oxlint-disable-next-line no-unsafe-assignment
      configToApply[key] = Config[key];
    }
  }

  await UpdateConfig.applyConfig(configToApply, {
    nosave: true,
    tribeOverride: true,
  });
}

export function setLoadingIndicator(bool: boolean): void {
  if (bool) {
    $(
      ".pageTribe .tribePage.lobby .currentConfig .loadingIndicator",
    ).removeClass("hidden");
  } else {
    $(".pageTribe .tribePage.lobby .currentConfig .loadingIndicator").addClass(
      "hidden",
    );
  }
}

function sync(): void {
  if (!TribeState.isInARoom()) return;
  if (!TribeState.getSelf()?.isLeader) return;
  setLoadingIndicator(true);
  TribeButtons.disableStartButton();
  debouncedSync();
}

const debouncedSync = debounce(1000, () => {
  tribeSocket.out.room.updateConfig(getTribeConfig());
});

export function getTribeConfig(): TribeTypes.RoomConfig {
  const test: Partial<TribeTypes.RoomConfig> = {};
  Object.entries(configMetadata).map(([key, meta]) => {
    const typedKey = key as keyof TribeTypes.RoomConfig;
    if ("tribeBlocked" in meta && meta.tribeBlocked) {
      // @ts-expect-error customText skipped above
      test[typedKey] = Config[typedKey] as keyof typeof test;
    }
  });

  test.customText = CustomText.getData();
  return test as TribeTypes.RoomConfig;
}

TribeConfigSyncEvent.subscribe(() => {
  sync();
});
