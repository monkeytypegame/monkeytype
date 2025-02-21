import { Config } from "@monkeytype/contracts/schemas/configs";
import { Layout, Keys } from "./json-data";

type KeyProperties = {
  a: number; // legend alignment: ignore
  w: number; // width
  h: number; // height
  x: number; // x position
  y: number; // y position
};

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
    const rowData: string[] = keymapLayout.keys[currentRow as keyof Keys];
    const hide =
      currentRow === "row1" && !config.keymapShowTopRow ? ` invisible` : "";
    row.map((key: KeyProperties | string, index: number) => {
      const element: KeyProperties | string = key;
      const keyData: string = rowData[index] ?? "";
      const keyString: string =
        (config.keymapLegendStyle === "uppercase"
          ? keyData[0]?.toUpperCase() ?? ""
          : keyData[0]) ?? "";
      let bigKey = "";
      if (typeof element === "object" && element != null) {
        if ("x" in element) {
          rowText += `<div class="keymapSplitSpacer"></div>`;
        }
        if ("w" in element) {
          bigKey = ` key${(element.w * 100).toString()}`;
        }
        // remove the next element since it has been processed already with this KeyProperties object
        // unless we want to include the actual letter that it represents in the future
        row.splice(index, 1);
      }
      rowText += `
                <div class="keymapKey${bigKey}${hide}" data-key="${keyData.replace(
        '"',
        "&quot;"
      )}">
                    <span class="letter">${keyString?.toString()}</span>
                </div>
            `;
    });
    keymapText += `<div class="row r${index + 1}">${rowText}</div>`;
  });
  return keymapText;
}
