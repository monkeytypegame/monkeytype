import { readdirSync } from "fs";
import { LayoutsList } from "../../src/ts/constants/layouts";
import { LayoutName } from "@monkeytype/contracts/schemas/layouts";

describe("layouts", () => {
  it("should not have duplicates", () => {
    const duplicates = LayoutsList.filter(
      (item, index) => LayoutsList.indexOf(item) !== index
    );
    expect(duplicates).toEqual([]);
  });
  it("should have all related json files", () => {
    const layoutFiles = listLayoutFiles();

    const missingLayoutFiles = LayoutsList.filter(
      (it) => !layoutFiles.includes(it)
    ).map((it) => `fontend/static/layouts/${it}.json`);

    expect(missingLayoutFiles, "missing layout json files").toEqual([]);
  });
  it("should not have additional related json files", () => {
    const layoutFiles = listLayoutFiles();

    const additionalLayoutFiles = layoutFiles
      .filter((it) => !LayoutsList.includes(it))
      .map((it) => `fontend/static/layouts/${it}.json`);

    expect(
      additionalLayoutFiles,
      "additional layout json files not declared in frontend/src/ts/constants/layouts.ts"
    ).toEqual([]);
  });
});

function listLayoutFiles() {
  return readdirSync(import.meta.dirname + "/../../static/layouts").map(
    (it) => it.substring(0, it.length - 5) as LayoutName
  );
}
