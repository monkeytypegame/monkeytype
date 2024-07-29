import * as Misc from "./utils/misc";
import * as JSONData from "./utils/json-data";
import * as Notifications from "./elements/notifications";
import { ZodSchema, z } from "zod";

type PossibleTypeAsync = "layoutfluid";

// function isConfigKeyValid(name: string): boolean {
//   if (name === null || name === undefined || name === "") return false;
//   if (name.length > 30) return false;
//   return /^[0-9a-zA-Z_.\-#+]+$/.test(name);
// }

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

export function isConfigValueValid<T>(
  key: string,
  val: T,
  schema: ZodSchema<T>
): boolean {
  const isValid = schema.safeParse(val).success;
  if (!isValid) invalid(key, val, undefined);

  return isValid;
}
export function isConfigValueValidBoolean(key: string, val: boolean): boolean {
  return isConfigValueValid(key, val, z.boolean());
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

        try {
          await JSONData.getLayoutsList();
        } catch (e) {
          customMessage = Misc.createErrorMessage(
            e,
            "Failed to validate layoutfluid value"
          );
          break;
        }

        // convert the layout names to layouts
        const layouts = await Promise.all(
          layoutNames.map(async (layoutName) => JSONData.getLayout(layoutName))
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
