import * as PbTablesModal from "../modals/pb-tables";
import * as EditResultTagsModal from "../modals/edit-result-tags";
import * as AddFilterPresetModal from "../modals/new-filter-preset";
import { parseWithSchema as parseJsonWithSchema } from "@monkeytype/util/json";
import { z } from "zod";
import { qs } from "../utils/dom";

const accountPage = qs("#pageAccount");

accountPage?.onChild("click", ".pbsTime .showAllButton", () => {
  PbTablesModal.show("time");
});

accountPage?.onChild("click", ".pbsWords .showAllButton", () => {
  PbTablesModal.show("words");
});

const TagsArraySchema = z.array(z.string());

accountPage?.onChild("click", ".group.history .resultEditTagsButton", (e) => {
  const targetButton = e.childTarget as HTMLElement;
  const resultid = targetButton?.getAttribute("data-result-id");
  const tags = targetButton?.getAttribute("data-tags");

  EditResultTagsModal.show(
    resultid ?? "",
    parseJsonWithSchema(tags ?? "[]", TagsArraySchema),
    "accountPage",
  );
});

accountPage?.qs("button.createFilterPresetBtn")?.on("click", () => {
  AddFilterPresetModal.show();
});
