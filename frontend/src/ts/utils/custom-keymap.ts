import {
  KeyProperties,
  KeymapCustom,
  KeymapCustomSchema,
  Layout,
} from "@monkeytype/contracts/schemas/configs";
import { dataKeys as keyToDataObject } from "../constants/data-keys";
import { sanitizeString } from "@monkeytype/util/strings";
import { parseWithSchema } from "@monkeytype/util/json";

const columnMultiplier = 8;
const rowMultiplier = 8;
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
    element.x !== undefined &&
    element.w === undefined &&
    element.h === undefined &&
    element.y === undefined &&
    element.rx === undefined &&
    element.ry === undefined &&
    element.r === undefined
  );
}

function sanitizeKeymap(keymap: KeymapCustom): KeymapCustom {
  return keymap.map((row: (KeyProperties | string)[]) => {
    return row
      .map((element: KeyProperties | string) => {
        if (typeof element === "string") {
          return sanitizeString(element);
        }
        if (
          typeof element === "object" &&
          element !== null &&
          Object.keys(element).length > 0
        ) {
          return element;
        } else {
          return null;
        }
      })
      .filter((el): el is KeyProperties | string => el !== null);
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
  rowSpan: number,
  isInvisible: boolean,
  rotationAngle: number,
  columnOffset: number,
  rowOffset: number
): string {
  const dataKey = !isInvisible ? keyToData(keyString) : "";
  const span = !isInvisible
    ? `<span class="letter">${keyToData(keyString) && keyString}</span>`
    : "";
  const remUnit = (basicSpan + 2 * margin) / columnMultiplier;
  let transform = rotationAngle
    ? `transform-origin: ${(columnOffset ?? 0) * remUnit}rem ${
        (rowOffset ?? 0) * remUnit
      }rem; transform: rotate(${rotationAngle}deg);`
    : "";
  return `<div style="display: flex; grid-column: ${column} / span ${
    size * columnMultiplier
  }; grid-row: ${row} / span ${
    rowSpan * rowMultiplier
  }; ${transform}"><div class="keymapKey ${
    isInvisible ? "invisible" : ""
  }" data-key="${dataKey}">${span}
  </div></div>`.replace(/(\r\n|\r|\n|\s{2,})/g, "");
}

function createSpaceKey(
  layout: Layout,
  column: number,
  size: number,
  row: number,
  rowSpan: number
): string {
  return `<div style="display: flex; grid-column: ${column} / span ${
    size * columnMultiplier
  }; grid-row: ${row} / span ${
    rowSpan * rowMultiplier
  };""><div class="keymapKey keySpace layoutIndicator">
    <span class="letter">${sanitizeString(layout)}</span>
  </div></div>`.replace(/(\r\n|\r|\n|\s{2,})/g, "");
}

export function getCustomKeymapSyle(
  keymapStyle: KeymapCustom,
  layout: Layout
): string {
  const keymapCopy = [...keymapStyle];
  let maxColumn = 1,
    maxRow = 1,
    currentRow = 1,
    rotationAngle = 0,
    rowOffset = 0,
    isRotationSectionStarted: boolean;
  const keymapHtml = keymapCopy.map((row: (KeyProperties | string)[]) => {
    const rowCopy = [...row];
    let currentColumn = 1,
      columnOffset = 0;
    const rowHtml = rowCopy.map(
      (element: KeyProperties | string, index: number) => {
        let keyHtml: string = "",
          keyString: string =
            typeof element === "string"
              ? sanitizeString(element).toLowerCase()
              : "",
          columnSpan = 1,
          rowSpan = 1,
          isInvisible = false;
        if (isOnlyInvisibleKey(element) && element.x !== undefined) {
          columnSpan = element.x;
          keyString = "";
          isInvisible = true;
        } else if (isKeyProperties(element)) {
          if (element.w !== undefined && "w" in element) {
            columnSpan = element.w;
          }
          if (element.y !== undefined && "y" in element) {
            currentRow += element.y * rowMultiplier;
          }
          if (element.x !== undefined && "x" in element) {
            const size = element.x;
            keyHtml += createHtmlKey(
              "",
              currentColumn,
              size,
              currentRow,
              rowSpan,
              true,
              rotationAngle,
              columnOffset,
              rowOffset
            );
            currentColumn += size * columnMultiplier;
          }
          if (element.h !== undefined && "h" in element) {
            rowSpan = element.h;
          }
          if (element.r !== undefined && "r" in element) {
            rotationAngle = element.r;
            columnOffset = -(currentColumn - 1);
            rowOffset = -(currentRow - 1);
            // TODO improve this, not working
            if (element.rx !== undefined || element.ry !== undefined) {
              currentColumn = (element.rx ?? 0) * columnMultiplier + 1;
              currentRow = (element.ry ?? 0) * rowMultiplier + 1;
              if (element.y !== undefined && "y" in element) {
                currentRow += element.y * rowMultiplier;
                rowOffset = -1 * element.y * rowMultiplier;
              }
              if (element.x !== undefined && "x" in element) {
                currentColumn += element.x * columnMultiplier;
                columnOffset = -1 * element.x * columnMultiplier;
              }
              // columnOffset = - (element.x ?? 0) * columnMultiplier;
              // columnOffset = 0;
              // if(element.x !== undefined) {
              //   columnOffset = element.x * columnMultiplier;
              // }
              // // rowOffset = - (element.y ?? 0) * rowMultiplier;
              // rowOffset = 0;
              // if (element.y !== undefined) {
              //   rowOffset = - (element.y * rowMultiplier);
              // }
              // rotationColumn = currentColumn;
            }
            isRotationSectionStarted = true;
          }
          keyString = sanitizeString(
            rowCopy[index + 1]?.toString() ?? ""
          ).toLowerCase();
          rowCopy.splice(index, 1);
        }

        // After all
        if (keyString === "spc") {
          keyHtml += createSpaceKey(
            layout,
            currentColumn,
            columnSpan,
            currentRow,
            rowSpan
          );
        } else {
          keyHtml += createHtmlKey(
            keyString,
            currentColumn,
            columnSpan,
            currentRow,
            rowSpan,
            isInvisible,
            rotationAngle,
            columnOffset,
            rowOffset
          );
        }
        maxColumn = currentColumn > maxColumn ? currentColumn : maxColumn;
        currentColumn += columnSpan * columnMultiplier;
        if (isRotationSectionStarted) {
          columnOffset -= columnSpan * columnMultiplier;
        }
        return keyHtml;
      }
    );
    maxRow = currentRow > maxRow ? currentRow : maxRow;
    currentRow += rowMultiplier;
    if (isRotationSectionStarted) {
      rowOffset -= rowMultiplier;
    }
    return rowHtml.join("");
  });
  return `<div style="display: grid; grid-template-columns: repeat(${
    maxColumn + columnMultiplier - 1
  }, ${
    (basicSpan + 2 * margin) / columnMultiplier
  }rem); grid-template-rows: repeat(${maxRow + rowMultiplier - 1}, ${
    (basicSpan + 2 * margin) / columnMultiplier
  }rem)">${keymapHtml.join("")}</div>`;
}
