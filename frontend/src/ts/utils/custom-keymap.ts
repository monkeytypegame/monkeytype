import { Config } from "@monkeytype/contracts/schemas/configs";
import { dataKeys as keyToDataObject } from "../constants/data-keys";

export type KeyProperties = {
  a?: number; // legend alignment: ignore
  w?: number; // width
  h?: number; // height
  x?: number; // x position
  y?: number; // y position
};

export type KeymapCustom = (KeyProperties | string)[][];

export function keyToData(key: string): string {
  return (key && keyToDataObject[key]) ?? "";
}

export function stringToKeymap(keymap: string): KeymapCustom {
  try {
    let processedKeymap = keymap.replace(/([{,])\s*(\w+)\s*:/g, '$1"$2":');
    processedKeymap = processedKeymap.replace(/"'"/g, '"&apos;"');
    const jsonKeymap: KeymapCustom = JSON.parse(
      processedKeymap
    ) as KeymapCustom;
    return jsonKeymap;
  } catch (error) {
    console.error("Error converting string to keymap:", error);
    return [[]];
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
  config: Config
): string {
  let keymapText = "";
  keymapStyle.map((row: (KeyProperties | string)[], index: number) => {
    let rowText = "";
    const hide =
      index == 0 && config.keymapShowTopRow === "never" ? ` invisible` : "";
    row.map((key: KeyProperties | string, index: number) => {
      const element: KeyProperties | string = key;
      let size = "";
      let keyString: string = typeof key === "string" ? key?.toString() : "";
      if (typeof element === "object" && element != null) {
        if ("x" in element) {
          rowText += `<div class="keymapKey invisible"></div>`;
        }
        if (element.w && "w" in element) {
          size = ` key${(element.w * 100).toString()}`;
        }
        // we take the next one since is the content of the current key
        keyString = row[index + 1]?.toString() ?? "";
        row.splice(index, 1);
      }
      let keyText = `
                <div class="keymapKey${size}${hide}" data-key="${keyToData(
        keyString.toLowerCase()
      )}">
                    <span class="letter">${keyString
                      ?.toLowerCase()
                      .toString()}</span>
                </div>
            `;
      if (keyString === "spc") {
        keyText = `
        <div class="keymapKey${size} keySpace layoutIndicator">
        <span class="letter">${config.layout}</span>
        </div>
        `;
      }
      rowText += keyText;
    });
    keymapText += `<div class="row r${index + 1}">${rowText}</div>`;
  });
  return keymapText;
}
