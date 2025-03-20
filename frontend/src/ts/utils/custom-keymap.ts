import {
  KeyProperties,
  KeymapCustom,
  KeymapCustomSchema,
  Layout,
} from "@monkeytype/contracts/schemas/configs";
import { dataKeys as keyToDataObject } from "../constants/data-keys";
import { sanitizeString } from "@monkeytype/util/strings";
import { parseWithSchema } from "@monkeytype/util/json";

function keyToData(key: string): string {
  return (key && keyToDataObject[key]) ?? "";
}

function isKeyProperties(
  element: KeyProperties | string
): element is KeyProperties {
  return typeof element === "object" && element != null;
}

export function stringToKeymap(keymap: string): KeymapCustom {
  try {
    const processedKeymap = sanitizeString(keymap).replace(
      /([{,])\s*(\w+)\s*:/g,
      '$1"$2":'
    );
    const jsonKeymap: KeymapCustom = parseWithSchema(
      processedKeymap,
      KeymapCustomSchema
    );
    return jsonKeymap;
  } catch (error) {
    throw new Error("Wrong keymap, make sure you copy the right JSON file!");
  }
}

export function keymapToString(keymap: KeymapCustom): string {
  try {
    if (keymap?.length == 1 && keymap[0]?.length == 0) {
      return "";
    }
    let jsonString = JSON.stringify(keymap ?? "");

    jsonString = jsonString.replace(/"(\w+)":/g, "$1:");

    return jsonString;
  } catch (error) {
    console.error("Error converting keymap to string:", error);
    return "";
  }
}

export function getCustomKeymapSyle(
  keymapStyle: KeymapCustom,
  layout: Layout
): string {
  const keymapCopy = [...keymapStyle];

  const keymapHtml = keymapCopy.map(
    (row: (KeyProperties | string)[], index: number) => {
      const rowCopy = [...row];
      const rowHtml = rowCopy.map(
        (element: KeyProperties | string, index: number) => {
          let size = "",
            keyHtml: string = "",
            keyString: string =
              typeof element === "string"
                ? sanitizeString(element.toString())
                : "";
          if (isKeyProperties(element)) {
            if (element.x && "x" in element) {
              keyHtml += `<div class="keymapKey invisible"></div>`;
            }
            if (element.w && "w" in element) {
              const pixels = 2 * element.w * 16;
              size = `style= "width: ${pixels}px"`;
            }
            // we take the next one since is the content of the current key
            keyString = rowCopy[index + 1]?.toString() ?? "";
            rowCopy.splice(index, 1);
          }
          keyHtml += `
        <div class="keymapKey" ${size} data-key="${keyToData(
            keyString.toLowerCase()
          )}">
          <span class="letter">${keyString?.toLowerCase().toString()}</span>
        </div>`;
          if (keyString === "spc") {
            keyHtml = `
        <div class="keymapKey keySpace layoutIndicator" ${size}>
          <span class="letter">${sanitizeString(layout)}</span>
        </div>`;
          }
          return keyHtml;
        }
      );
      return `<div class="row r${index + 1}">${rowHtml.join("")}</div>`;
    }
  );
  return keymapHtml.join("");
}
