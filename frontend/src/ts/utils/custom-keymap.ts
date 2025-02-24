import { Config } from "@monkeytype/contracts/schemas/configs";
import { Layout } from "./json-data";

//TODO move this to other side
const keyToDataObject: { [key: string]: string } = {
  a: "aA",
  b: "bB",
  c: "cC",
  d: "dD",
  e: "eE",
  f: "fF",
  g: "gG",
  h: "hH",
  i: "iI",
  j: "jJ",
  k: "kK",
  l: "lL",
  m: "mM",
  n: "nN",
  o: "oO",
  p: "pP",
  q: "qQ",
  r: "rR",
  s: "sS",
  t: "tT",
  u: "uU",
  v: "vV",
  w: "wW",
  x: "xX",
  y: "yY",
  z: "zZ",
  1: "1!",
  2: "2@",
  3: "3#",
  4: "4$",
  5: "5%",
  6: "6^",
  7: "7&",
  8: "8*",
  9: "9(",
  0: "0)",
  "-": "-_",
  "=": "=+",
  "[": "[{",
  "]": "]}",
  "\\": "\\|",
  ";": ";:",
  "'": `'"`,
  ",": ",<",
  ".": ".>",
  "/": "/?",
};

type KeyProperties = {
  a?: number; // legend alignment: ignore
  w?: number; // width
  h?: number; // height
  x?: number; // x position
  y?: number; // y position
};

export function keyToData(key: string): string {
  return (key && keyToDataObject[key]?.replace(`'"`, "&apos;&quot;")) ?? "";
}

export function getCustomKeymapSyle(
  keymapLayout: Layout,
  keymapStyle: (KeyProperties | string)[][],
  config: Config
): string {
  let keymapText = "";
  const rowsKeys: string[] = Object.keys(keymapLayout.keys);
  keymapStyle.map((row: (KeyProperties | string)[], index: number) => {
    let rowText = "";
    const currentRow: string = rowsKeys[index] ?? "row1";
    const hide =
      currentRow === "row1" && config.keymapShowTopRow === "never"
        ? ` invisible`
        : "";
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
        // we take the next one since it the content of the current key
        keyString = row[index + 1]?.toString() ?? "";
        row.splice(index, 1);
      }
      let keyText = `
                <div class="keymapKey${size}${hide}" data-key="${keyToData(
        keyString.toLowerCase()
      )}">
                    <span class="letter">${keyString?.toString()}</span>
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
