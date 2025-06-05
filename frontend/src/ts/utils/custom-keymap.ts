import {
  KeyProperties,
  KeymapCustom,
  KeymapCustomSchema,
  Layout,
} from "@monkeytype/contracts/schemas/configs";
import { dataKeys as keyToDataObject } from "../constants/data-keys";
import { sanitizeString } from "@monkeytype/util/strings";
import { parseWithSchema } from "@monkeytype/util/json";

const spanMultiplier = 4;
const basicSpan = 2;
const margin = 0.125;

function keyToData(key: string): string {
  return (key && keyToDataObject[key]) ?? "";
}

function isKeyProperties(
  element: KeyProperties | string
): element is KeyProperties {
  return typeof element === "object" && element !== null;
}

function isOnlyInvisibleKey(
  element: KeyProperties | string
): element is KeyProperties {
  return (
    typeof element === "object" &&
    element !== null &&
    element.x !== null &&
    element.w === undefined &&
    element.a === undefined &&
    element.h === undefined &&
    element.y === undefined
  );
}

function sanitizeKeymap(keymap: KeymapCustom): KeymapCustom {
  return keymap.map((row: (KeyProperties | string)[]) => {
    return row.map((element: KeyProperties | string) => {
      if (typeof element === "string") {
        return sanitizeString(element);
      }
      return element;
    });
  });
}

export function stringToKeymap(keymap: string): KeymapCustom {
  try {
    const isMatrix = /^\s*\[\s*\[[\s\S]*?\]\s*(,\s*\[[\s\S]*?\]\s*)*\]\s*$/;
    const quoteKeymap = keymap.replace(/([{,])\s*(\w+)\s*:/g, '$1"$2":');
    const processedKeymap = isMatrix.test(keymap)
      ? quoteKeymap
      : `[${quoteKeymap}]`;
    const jsonKeymap: KeymapCustom = parseWithSchema(
      processedKeymap,
      KeymapCustomSchema
    );
    return sanitizeKeymap(jsonKeymap);
  } catch (error) {
    throw new Error("Wrong keymap, make sure you copy the right JSON file!");
  }
}

export function keymapToString(keymap: KeymapCustom): string {
  try {
    if (keymap?.length === 1 && keymap[0]?.length === 0) {
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

function createHtmlKey(
  keyString: string,
  column: number,
  size: number,
  row: number,
  rowSpan: number
): string {
  return `<div style="display: flex; grid-column: ${column} / span ${
    size * spanMultiplier
  }; grid-row: ${
    row + 1
  } / span ${rowSpan};"><div class="keymapKey" data-key="${keyToData(
    keyString
  )}">
  <span class="letter">${keyToData(keyString) && keyString}</span>
  </div></div>`.replace(/(\r\n|\r|\n|\s{2,})/g, "");
}

function createInvisibleKey(
  column: number,
  size: number,
  row: number,
  rowSpan: number
): string {
  return `<div style="display: flex; grid-column: ${column} / span ${
    size * spanMultiplier
  }; grid-row: ${
    row + 1
  } / span ${rowSpan};"><div class="keymapKey invisible" data-key=""></div></div>`.replace(
    /(\r\n|\r|\n|\s{2,})/g,
    ""
  );
}

function createSpaceKey(
  layout: Layout,
  column: number,
  size: number,
  row: number,
  rowSpan: number
): string {
  return `<div style="display: flex; grid-column: ${column} / span ${
    size * spanMultiplier
  }; grid-row: ${
    row + 1
  } / span ${rowSpan};""><div class="keymapKey keySpace layoutIndicator">
    <span class="letter">${sanitizeString(layout)}</span>
  </div></div>`.replace(/(\r\n|\r|\n|\s{2,})/g, "");
}

export function getCustomKeymapSyle(
  keymapStyle: KeymapCustom,
  layout: Layout
): string {
  const keymapCopy = [...keymapStyle];
  let maxColumn = 1;
  const keymapHtml = keymapCopy.map(
    (row: (KeyProperties | string)[], currentRow: number) => {
      const rowCopy = [...row];
      let currentColumn = 1;
      const rowHtml = rowCopy.map(
        (element: KeyProperties | string, index: number) => {
          let keyHtml: string = "",
            keyString: string =
              typeof element === "string"
                ? sanitizeString(element).toLowerCase()
                : "",
            currentSize = 1,
            rowSpan = 1;

          if (isOnlyInvisibleKey(element)) {
            if (element.x !== undefined && "x" in element) {
              currentSize = element.x;
              keyHtml += createInvisibleKey(
                currentColumn,
                currentSize,
                currentRow,
                rowSpan
              );
            }
          } else if (isKeyProperties(element)) {
            if (element.w !== undefined && "w" in element) {
              currentSize = element.w;
              if (element.x !== undefined && "x" in element) {
                const size = element.x;
                keyHtml += createInvisibleKey(
                  currentColumn,
                  size,
                  currentRow,
                  rowSpan
                );
                currentColumn += size * spanMultiplier;
              }

              if (element.h !== undefined && "h" in element) {
                rowSpan = element.h;
              }

              keyString = rowCopy[index + 1]?.toString() ?? "";
              rowCopy.splice(index, 1);
              if (keyString === "spc") {
                keyHtml += createSpaceKey(
                  layout,
                  currentColumn,
                  currentSize,
                  currentRow,
                  rowSpan
                );
              } else {
                keyHtml += createHtmlKey(
                  keyString,
                  currentColumn,
                  currentSize,
                  currentRow,
                  rowSpan
                );
              }
            } else if (element.h !== undefined && "h" in element) {
              rowSpan = element.h;
              if (element.x !== undefined && "x" in element) {
                const size = element.x;
                keyHtml += createInvisibleKey(
                  currentColumn,
                  size,
                  currentRow,
                  1
                );
                currentColumn += size * spanMultiplier;
              }

              keyString = rowCopy[index + 1]?.toString() ?? "";
              rowCopy.splice(index, 1);
              if (keyString === "spc") {
                keyHtml += createSpaceKey(
                  layout,
                  currentColumn,
                  currentSize,
                  currentRow,
                  rowSpan
                );
              } else {
                keyHtml += createHtmlKey(
                  keyString,
                  currentColumn,
                  currentSize,
                  currentRow,
                  rowSpan
                );
              }
            }
          } else {
            keyHtml += createHtmlKey(
              keyString,
              currentColumn,
              currentSize,
              currentRow,
              rowSpan
            );
          }
          maxColumn = currentColumn > maxColumn ? currentColumn : maxColumn;
          currentColumn += currentSize * spanMultiplier;
          return keyHtml;
        }
      );
      return rowHtml.join("");
    }
  );
  return `<div style="display: grid; grid-template-columns: repeat(${
    maxColumn + spanMultiplier - 1
  }, ${
    basicSpan / spanMultiplier + margin / 2
  }rem); grid-template-rows: repeat(${keymapCopy.length}, ${
    basicSpan + margin * 2
  }rem)">${keymapHtml.join("")}</div>`;
}
