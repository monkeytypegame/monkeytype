import { z } from "zod";
import { LocalStorageWithSchema } from "../../utils/local-storage-with-schema";
import { IdSchema } from "@monkeytype/schemas/util";
import { authEvent } from "../../events/auth";
import { tags, setTags } from "./store";
import { produce } from "solid-js/store";

const activeTagsLS = new LocalStorageWithSchema({
  key: "activeTags",
  schema: z.array(IdSchema),
  fallback: [],
});

export function saveActiveToLocalStorage(): void {
  activeTagsLS.set(tags.filter((t) => t.active).map((t) => t._id));
}

export function toggleTagActive(tagId: string, nosave = false): void {
  setTags(
    (tag) => tag._id === tagId,
    produce((tag) => {
      tag.active = !tag.active;
    }),
  );
  if (!nosave) saveActiveToLocalStorage();
}

export function setTagActive(
  tagId: string,
  state: boolean,
  nosave = false,
): void {
  setTags(
    (tag) => tag._id === tagId,
    produce((tag) => {
      tag.active = state;
    }),
  );
  if (!nosave) saveActiveToLocalStorage();
}

export function clearActiveTags(nosave = false): void {
  setTags(
    (tag) => tag.active,
    produce((tag) => {
      tag.active = false;
    }),
  );
  if (!nosave) saveActiveToLocalStorage();
}

function loadActiveFromLocalStorage(): void {
  const savedIds = activeTagsLS.get();
  for (const id of savedIds) {
    toggleTagActive(id, true);
  }
  saveActiveToLocalStorage();
}

authEvent.subscribe((event) => {
  if (event.type === "snapshotUpdated" && event.data.isInitial) {
    loadActiveFromLocalStorage();
  }
});
