import * as Misc from "./utils/misc";
import * as JSONData from "./utils/json-data";
import * as Notifications from "./elements/notifications";
import { ZodSchema, z } from "zod";

type PossibleTypeAsync = "layoutfluid";

// Helper function to validate layout names
function isValidLayoutName(layoutName: string): boolean {
  const validLayoutPattern = /^[0-9a-zA-Z_.\-#+]+$/; // Allow alphanumeric, underscore, dash, period, #, and +
  return validLayoutPattern.test(layoutName);
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

        // Split by spaces or #
        const layoutNames = val.split(/[# ]+/).map(name => name.trim());

        // Validate each layout name using the regex that allows hyphens
        if (!layoutNames.every(isValidLayoutName)) {
          customMessage =
            "Layout names can only contain alphanumeric characters, underscores, hyphens, periods, #, or +.";
          break;
        }

        if (layoutNames.length < 2 || layoutNames.length > 5) {
          customMessage = "Number of layout names must be between 2 and 5.";
          break;
        }

        try {
          await JSONData.getLayoutsList();
        } catch (e) {
          customMessage = Misc.createErrorMessage(
            e,
            "Failed to validate layoutfluid value"
          );
          break;
        }

        // Convert layout names to layouts and check if all exist
        const layouts = await Promise.all(
          layoutNames.map(async (layoutName) => JSONData.getLayout(layoutName))
        );

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
