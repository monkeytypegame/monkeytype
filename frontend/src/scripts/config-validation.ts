import * as Misc from "./misc";
import * as Notifications from "./elements/notifications";

type PossibleType =
  | "string"
  | "number"
  | "numberArray"
  | "boolean"
  | "undefined"
  | "null"
  | "stringArray"
  | string[]
  | number[];

type PossibleTypeAsync = "layoutfluid";

export function isConfigKeyValid(name: string): boolean {
  if (name === null || name === undefined || name === "") return false;
  if (name.length > 30) return false;
  return /^[0-9a-zA-Z_.\-#+]+$/.test(name);
}

function invalid(key: string, val: unknown, customMessage?: string): void {
  if (customMessage === undefined) {
    Notifications.add(
      `Invalid value for ${key} (${val}). Please try to change this setting again.`,
      -1
    );
  } else {
    Notifications.add(
      `Invalid value for ${key} (${val}). ${customMessage}`,
      -1
    );
  }

  console.error(`Invalid value key ${key} value ${val} type ${typeof val}`);
}

function isArray(val: unknown): val is unknown[] {
  return val instanceof Array;
}

export function isConfigValueValid(
  key: string,
  val: unknown,
  possibleTypes: PossibleType[]
): boolean {
  let isValid = false;

  // might be used in the future
  // eslint-disable-next-line
  let customMessage: string | undefined = undefined;

  for (const possibleType of possibleTypes) {
    switch (possibleType) {
      case "boolean":
        if (typeof val === "boolean") isValid = true;
        break;

      case "null":
        if (val === null) isValid = true;
        break;

      case "number":
        if (typeof val === "number") isValid = true;
        break;

      case "numberArray":
        if (isArray(val) && val.every((v) => typeof v === "number")) {
          isValid = true;
        }
        break;

      case "string":
        if (typeof val === "string") isValid = true;
        break;

      case "stringArray":
        if (isArray(val) && val.every((v) => typeof v === "string")) {
          isValid = true;
        }
        break;

      case "undefined":
        if (typeof val === "undefined" || val === undefined) isValid = true;
        break;

      default:
        if (isArray(possibleType)) {
          if (possibleType.includes(<never>val)) isValid = true;
        }
        break;
    }
  }

  if (!isValid) invalid(key, val, customMessage);

  return isValid;
}

export async function isConfigValueValidAsync(
  key: string,
  val: unknown,
  possibleTypes: PossibleTypeAsync[]
): Promise<boolean> {
  let isValid = false;

  let customMessage: string | undefined = undefined;

  for (const possibleType of possibleTypes) {
    switch (possibleType) {
      case "layoutfluid": {
        if (typeof val !== "string") break;

        const layoutNames = val.split(/[# ]+/);

        if (layoutNames.length < 2 || layoutNames.length > 5) break;

        // convert the layout names to layouts
        const layouts = await Promise.all(
          layoutNames.map((layoutName) => Misc.getLayout(layoutName))
        );

        // check if all layouts exist
        if (!layouts.every((layout) => layout !== undefined)) {
          const invalidLayoutNames = layoutNames.map((layoutName, index) => [
            layoutName,
            layouts[index],
          ]);

          const invalidLayouts = invalidLayoutNames
            .filter(([_, layout]) => layout === undefined)
            .map(([layoutName]) => layoutName);

          customMessage = `The following inputted layouts do not exist: ${invalidLayouts.join(
            ", "
          )}`;

          break;
        }

        isValid = true;

        break;
      }
    }
  }

  if (!isValid) invalid(key, val, customMessage);

  return isValid;
}
