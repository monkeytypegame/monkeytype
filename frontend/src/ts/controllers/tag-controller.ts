import { z } from "zod";
import * as DB from "../db";
import * as ModesNotice from "../elements/modes-notice";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import { IdSchema } from "@monkeytype/contracts/schemas/util";

const activeTagsLS = new LocalStorageWithSchema({
  key: "activeTags",
  schema: z.array(IdSchema),
  fallback: [],
});

export function saveActiveToLocalStorage(): void {
  const tags: string[] = [];

  DB.getSnapshot()?.tags?.forEach((tag) => {
    if (tag.active === true) {
      tags.push(tag._id);
    }
  });

  activeTagsLS.set(tags);
}

export function clear(nosave = false): void {
  const snapshot = DB.getSnapshot();
  if (!snapshot) return;

  snapshot.tags = snapshot.tags?.map((tag) => {
    tag.active = false;

    return tag;
  });

  DB.setSnapshot(snapshot);
  void ModesNotice.update();
  if (!nosave) saveActiveToLocalStorage();
}

export function set(tagid: string, state: boolean, nosave = false): void {
  const snapshot = DB.getSnapshot();
  if (!snapshot) return;

  snapshot.tags = snapshot.tags?.map((tag) => {
    if (tag._id === tagid) {
      tag.active = state;
    }

    return tag;
  });

  DB.setSnapshot(snapshot);
  void ModesNotice.update();
  if (!nosave) saveActiveToLocalStorage();
}

export function toggle(tagid: string, nosave = false): void {
  DB.getSnapshot()?.tags?.forEach((tag) => {
    if (tag._id === tagid) {
      if (tag.active === undefined) {
        tag.active = true;
      } else {
        tag.active = !tag.active;
      }
    }
  });
  void ModesNotice.update();
  if (!nosave) saveActiveToLocalStorage();
}

export function loadActiveFromLocalStorage(): void {
  const newTags = activeTagsLS.get();
  for (const tag of newTags) {
    toggle(tag, true);
  }
  saveActiveToLocalStorage();
}
