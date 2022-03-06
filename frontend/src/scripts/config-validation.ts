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

type PossibleTypeAsync = "layoutfluid" | "customLayouts";

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
        if (isArray(val) && val.every((v) => typeof v === "number"))
          isValid = true;
        break;

      case "string":
        if (typeof val === "string") isValid = true;
        break;

      case "stringArray":
        if (isArray(val) && val.every((v) => typeof v === "string"))
          isValid = true;
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
  possibleTypes: PossibleTypeAsync[],
  config?: MonkeyTypes.Config
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
          layoutNames.map((layoutName) => Misc.getLayout(layoutName, config))
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

      case "customLayouts":
        customLayouts: {
          if (!isLayoutsObject(val)) break;

          const layoutsList = await Misc.getLayoutsList(undefined, true);

          if (Object.keys(val).length > 5) {
            customMessage =
              "You have reached the maximum amount of custom layouts (5).";

            break;
          }

          for (const layoutName in val) {
            if (layoutName in layoutsList) {
              customMessage = "This layout already exists.";

              break customLayouts;
            }

            if (layoutName.length > 20) {
              customMessage = "Layout name is too long (Max 20 characters).";

              break customLayouts;
            }

            const layout = val[layoutName];

            if (
              layout.keymapShowTopRow === undefined ||
              layout.keys === undefined ||
              layout.type === undefined ||
              typeof layout.keymapShowTopRow !== "boolean" ||
              typeof layout.keys !== "object" ||
              typeof layout.type !== "string"
            )
              break customLayouts;

            if (layout.keys.row1 === undefined) break customLayouts;
            if (layout.keys.row2 === undefined) break customLayouts;
            if (layout.keys.row3 === undefined) break customLayouts;
            if (layout.keys.row4 === undefined) break customLayouts;
            if (layout.keys.row5 === undefined) break customLayouts;

            if (layout.keys.row1.length !== 13) break customLayouts;
            if (layout.type === "iso") {
              if (layout.keys.row2.length !== 12) break customLayouts;
              if (layout.keys.row3.length !== 12) break customLayouts;
              if (layout.keys.row4.length !== 11) break customLayouts;
            } else {
              if (layout.keys.row2.length !== 13) break customLayouts;
              if (layout.keys.row3.length !== 11) break customLayouts;
              if (layout.keys.row4.length !== 10) break customLayouts;
            }
            if (layout.keys.row5.length !== 1) break customLayouts;

            const { row1, row2, row3, row4, row5 } = layout.keys;

            const keysArray = [...row1, ...row2, ...row3, ...row4, ...row5];

            if (keysArray.some((key) => key.length !== 2 && key !== " ")) {
              customMessage = "One or more keys are not 2 characters";

              break customLayouts;
            }
          }

          isValid = true;

          break;
        }
    }
  }

  if (!isValid) invalid(key, val, customMessage);

  return isValid;
}

function isLayoutsObject(val: unknown): val is MonkeyTypes.LayoutsObject {
  if (typeof val !== "object") return false;

  if (val === null) return false;

  if (!Object.values(val).every((v) => typeof v === "object")) return false;

  return true;
}
