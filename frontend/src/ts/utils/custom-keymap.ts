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
  rotationAngle: number | undefined,
  columnOffset: number,
  rowOffset: number
): string {
  const dataKey = !isInvisible ? keyToData(keyString) : "";
  const span = !isInvisible
    ? `<span class="letter">${keyToData(keyString) && keyString}</span>`
    : "";
  const remUnit = (basicSpan + 2 * margin) / columnMultiplier;
  let transform =
    rotationAngle !== undefined
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
  rowSpan: number,
  rotationAngle: number | undefined,
  columnOffset: number,
  rowOffset: number
): string {
  const remUnit = (basicSpan + 2 * margin) / columnMultiplier;
  let transform =
    rotationAngle !== undefined
      ? `transform-origin: ${(columnOffset ?? 0) * remUnit}rem ${
          (rowOffset ?? 0) * remUnit
        }rem; transform: rotate(${rotationAngle}deg);`
      : "";
  return `<div style="display: flex; grid-column: ${column} / span ${
    size * columnMultiplier
  }; grid-row: ${row} / span ${
    rowSpan * rowMultiplier
  }; ${transform}""><div class="keymapKey keySpace layoutIndicator">
    <span class="letter">${sanitizeString(layout)}</span>
  </div></div>`.replace(/(\r\n|\r|\n|\s{2,})/g, "");
}

function createKey(
  keyString: string,
  layout: Layout,
  column: number,
  size: number,
  row: number,
  rowSpan: number,
  isInvisible: boolean,
  rotationAngle: number | undefined,
  columnOffset: number,
  rowOffset: number
): string {
  if (keyString === "spc") {
    return createSpaceKey(
      layout,
      column,
      size,
      row,
      rowSpan,
      rotationAngle,
      columnOffset,
      rowOffset
    );
  } else {
    return createHtmlKey(
      keyString,
      column,
      size,
      row,
      rowSpan,
      isInvisible,
      rotationAngle,
      columnOffset,
      rowOffset
    );
  }
}

export function getCustomKeymapSyle(
  keymapStyle: KeymapCustom,
  layout: Layout
): string {
  const keymapCopy = [...keymapStyle];
  let maxColumn = 1,
    maxRow = 1,
    rotationRow = 1,
    currentRow = 1,
    rowOffset = 0,
    rotationAngle: number | undefined,
    isRotationSectionStarted: boolean,
    rotationColumn: number | undefined;
  const keymapHtml = keymapCopy.map((row: (KeyProperties | string)[]) => {
    const rowCopy = [...row];
    let currentColumn = rotationColumn !== undefined ? rotationColumn : 1,
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
          maxColumn = currentColumn > maxColumn ? currentColumn : maxColumn;
          currentColumn += element.x * columnMultiplier;
          if (isRotationSectionStarted) {
            columnOffset += -1 * element.x * columnMultiplier;
          }
          return;
        } else if (isKeyProperties(element)) {
          if (element.w !== undefined && "w" in element) {
            columnSpan = element.w;
          }
          if (element.y !== undefined && "y" in element) {
            currentRow += element.y * rowMultiplier;
            if (isRotationSectionStarted) {
              rowOffset += -1 * element.y * rowMultiplier;
            }
          }
          if (element.x !== undefined && "x" in element) {
            currentColumn += element.x * columnMultiplier;
            if (isRotationSectionStarted) {
              columnOffset += -1 * element.x * columnMultiplier;
            }
          }
          if (element.h !== undefined && "h" in element) {
            rowSpan = element.h;
          }
          if (element.r !== undefined && "r" in element) {
            rotationAngle = element.r;
            columnOffset = -(currentColumn - 1);
            rowOffset = -(currentRow - 1);
            if (element.rx !== undefined || element.ry !== undefined) {
              currentColumn =
                element.rx !== undefined
                  ? element.rx * columnMultiplier + 1
                  : rotationColumn ?? 1;
              currentRow =
                element.ry !== undefined
                  ? element.ry * rowMultiplier + 1
                  : rotationRow ?? 1;
              rotationColumn = currentColumn;
              rotationRow = currentRow;
              rowOffset = 0;
              columnOffset = 0;
              if (element.y !== undefined && "y" in element) {
                currentRow += element.y * rowMultiplier;
                rowOffset = -1 * element.y * rowMultiplier;
              }
              if (element.x !== undefined && "x" in element) {
                currentColumn += element.x * columnMultiplier;
                columnOffset = -1 * element.x * columnMultiplier;
              }
            }
            isRotationSectionStarted = true;
          }
          keyString = sanitizeString(
            rowCopy[index + 1]?.toString() ?? ""
          ).toLowerCase();
          rowCopy.splice(index, 1);
        }

        keyHtml += createKey(
          keyString,
          layout,
          currentColumn,
          columnSpan,
          currentRow,
          rowSpan,
          isInvisible,
          rotationAngle,
          columnOffset,
          rowOffset
        );
        maxColumn = currentColumn > maxColumn ? currentColumn : maxColumn;
        currentColumn += columnSpan * columnMultiplier;
        if (isRotationSectionStarted) {
          columnOffset += -1 * columnSpan * columnMultiplier;
        }
        return keyHtml;
      }
    );
    maxRow = currentRow > maxRow ? currentRow : maxRow;
    currentRow += rowMultiplier;
    if (isRotationSectionStarted) {
      rowOffset += -1 * rowMultiplier;
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
