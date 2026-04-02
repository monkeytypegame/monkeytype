import { UserTag } from "@monkeytype/schemas/users";
import { createStore, produce, reconcile } from "solid-js/store";

export type TagItem = UserTag & { active: boolean; display: string };

export const [tags, setTags] = createStore<TagItem[]>([]);

export function seedFromUserData(userTags: UserTag[]): void {
  const items: TagItem[] = userTags
    .map((tag) => ({
      ...tag,
      active: false,
      display: tag.name.replaceAll("_", " "),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  setTags(reconcile(items, { key: "_id", merge: true }));
}

export function getTags(): TagItem[] {
  return tags;
}

export function getTag(id: string): TagItem | undefined {
  return tags.find((tag) => tag._id === id);
}

export function getActiveTags(): TagItem[] {
  return tags.filter((tag) => tag.active);
}

export function insertTag(tag: UserTag): void {
  setTags((prev) =>
    [
      ...prev,
      {
        ...tag,
        active: false,
        display: tag.name.replaceAll("_", " "),
      },
    ].sort((a, b) => a.name.localeCompare(b.name)),
  );
}

export function updateTag(
  tagId: string,
  updater: (old: TagItem) => void,
): void {
  setTags((tag) => tag._id === tagId, produce(updater));
}

export function deleteTag(tagId: string): void {
  setTags((prev) => prev.filter((tag) => tag._id !== tagId));
}
