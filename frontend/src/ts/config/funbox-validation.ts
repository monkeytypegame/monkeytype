import { checkForcedConfig, getFunbox } from "@monkeytype/funbox";
import { Config, ConfigValue, FunboxName } from "@monkeytype/schemas/configs";

export function canSetConfigWithCurrentFunboxes(
  key: string,
  value: ConfigValue,
  funbox: FunboxName[] = [],
): boolean {
  const funboxes = getFunbox(funbox);
  if (key === "mode") {
    let fb = getFunbox(funbox).filter(
      (f) =>
        f.frontendForcedConfig?.["mode"] !== undefined &&
        !(f.frontendForcedConfig["mode"] as ConfigValue[]).includes(value),
    );
    if (value === "zen") {
      fb = fb.concat(
        funboxes.filter((f) => {
          const funcs = f.frontendFunctions ?? [];
          const props = f.properties ?? [];
          return (
            funcs.includes("getWord") ||
            funcs.includes("pullSection") ||
            funcs.includes("alterText") ||
            funcs.includes("withWords") ||
            props.includes("changesCapitalisation") ||
            props.includes("nospace") ||
            props.some((fp) => fp.startsWith("toPush:")) ||
            props.includes("changesWordsVisibility") ||
            props.includes("speaks") ||
            props.includes("changesLayout") ||
            props.includes("changesWordsFrequency")
          );
        }),
      );
    }
    if (value === "quote" || value === "custom") {
      fb = fb.concat(
        funboxes.filter((f) => {
          const funcs = f.frontendFunctions ?? [];
          const props = f.properties ?? [];
          return (
            funcs.includes("getWord") ||
            funcs.includes("pullSection") ||
            funcs.includes("withWords") ||
            props.includes("changesWordsFrequency")
          );
        }),
      );
    }

    if (fb.length > 0) {
      return false;
    }
  }
  if (!checkForcedConfig(key, value, funboxes).result) {
    return false;
  }

  return true;
}

// Workaround for https://bugs.webkit.org/show_bug.cgi?id=256171 in Safari 16.5 or earlier
function isOldSafari(userAgent: string): boolean {
  if (!/^((?!chrome|android).)*safari/i.test(userAgent)) return false;
  const versionMatch = /.*Version\/([0-9]*)\.([0-9]*).*/.exec(userAgent);
  const mainVersion =
    versionMatch !== null ? parseInt(versionMatch[1] ?? "0") : 0;
  const minorVersion =
    versionMatch !== null ? parseInt(versionMatch[2] ?? "0") : 0;
  return mainVersion <= 16 && minorVersion <= 5;
}

/**
 * Message to show when the browser can't run the funbox, undefined when it can.
 */
export function getFunboxUnsupportedReason(
  funbox: FunboxName,
  userAgent = navigator.userAgent,
): string | undefined {
  if (funbox === "crt" && isOldSafari(userAgent)) {
    return "CRT is not available on Safari 16.5 or earlier.";
  }
  return undefined;
}

export type FunboxConfigError = {
  key: string;
  value: ConfigValue;
};

export function canSetFunboxWithConfig(
  funbox: FunboxName,
  config: Config,
): { ok: true } | { ok: false; errors: FunboxConfigError[] } {
  const funboxToCheck = [...config.funbox, funbox];

  const errors: FunboxConfigError[] = [];
  for (const [configKey, configValue] of Object.entries(config)) {
    if (
      !canSetConfigWithCurrentFunboxes(configKey, configValue, funboxToCheck)
    ) {
      errors.push({
        key: configKey,
        value: configValue,
      });
    }
  }
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true };
}
