import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import {
  defaultLyricsFilterOptions,
  LyricsFilterOptions,
  LyricsFilterOptionsSchema,
} from "../utils/lyrics-filter";

const lyricsFilterOptionsLS = new LocalStorageWithSchema({
  key: "lyricsFilterOptions",
  schema: LyricsFilterOptionsSchema,
  fallback: defaultLyricsFilterOptions,
  // options added later fall back to their defaults instead of resetting all
  migrate: (oldData) => {
    // stored value is an object; an array would be a corrupted entry
    const stored = Array.isArray(oldData) ? {} : oldData;
    const merged = { ...defaultLyricsFilterOptions, ...stored };
    const parsed = LyricsFilterOptionsSchema.safeParse(merged);
    return parsed.success ? parsed.data : { ...defaultLyricsFilterOptions };
  },
});

export function getLyricsFilterOptions(): LyricsFilterOptions {
  return lyricsFilterOptionsLS.get();
}

export function setLyricsFilterOptions(options: LyricsFilterOptions): void {
  lyricsFilterOptionsLS.set(options);
}
