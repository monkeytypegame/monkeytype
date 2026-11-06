import {
  batch,
  createMemo,
  createSignal,
  For,
  JSXElement,
  onCleanup,
  Setter,
  Show,
  untrack,
} from "solid-js";

import { setConfig } from "../../config/setters";
import { Config } from "../../config/store";
import {
  hideModal,
  hideModalAndClearChain,
  isModalInStack,
} from "../../states/modals";
import {
  showErrorNotification,
  showNoticeNotification,
} from "../../states/notifications";
import { getLoadedChallenge, setLoadedChallenge } from "../../states/test";
import * as CustomText from "../../test/custom-text";
import {
  getLyricsFilterOptions,
  setLyricsFilterOptions,
} from "../../test/lyrics-settings";
import * as PractiseWords from "../../test/practise-words";
import { restartTest } from "../../test/test-logic";
import { cn } from "../../utils/cn";
import {
  defaultLyricsFilterOptions,
  filterLyrics,
  findFoldableChars,
  getFoldReplacement,
  LyricsFilterOptions,
  lyricsToWords,
} from "../../utils/lyrics-filter";
import {
  fetchTrackInfo,
  LyricsTrack,
  RateLimitError,
  searchTracks,
  ServerBusyError,
  TrackInfo,
} from "../../utils/lyrics-provider";
import { splitIntoCharacters } from "../../utils/strings";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";

const inputClass = cn(
  "w-full rounded border-none bg-sub-alt p-[0.5em] text-em-base leading-[1.25em] caret-main outline-none",
  "focus-visible:shadow-[0_0_0_0.1rem_var(--bg-color),0_0_0_0.2rem_var(--text-color)]",
);

type CustomTextIncomingData =
  | ({
      set?: boolean;
      long?: boolean;
      pipeDelimiter?: boolean;
    } & (
      | { text: string; splitText?: never }
      | { text?: never; splitText: string[] }
    ))
  | null;

function lrclibProblemText(error: unknown): string {
  return error instanceof RateLimitError
    ? "LRCLIB is limiting requests right now. Wait a moment and try again."
    : "LRCLIB is busy right now. This usually passes, try again in a moment.";
}

function Toggle(props: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}): JSXElement {
  return (
    <label
      class="flex cursor-pointer items-center gap-2 select-none"
      title={props.hint}
    >
      <input
        type="checkbox"
        class="accent-main"
        checked={props.checked}
        onChange={(e) => props.onChange(e.currentTarget.checked)}
      />
      <span>{props.label}</span>
    </label>
  );
}

function Choice<T extends string>(props: {
  label: string;
  value: T;
  options: { value: T; text: string }[];
  onChange: (value: T) => void;
}): JSXElement {
  return (
    <div class="grid gap-1">
      <div class="text-xs text-sub">{props.label}</div>
      <div class="flex flex-wrap gap-2">
        <For each={props.options}>
          {(option) => (
            <Button
              variant="button"
              text={option.text}
              active={props.value === option.value}
              onClick={() => props.onChange(option.value)}
            />
          )}
        </For>
      </div>
    </div>
  );
}

export function LyricsSearchModal(props: {
  setChainedData: Setter<CustomTextIncomingData>;
}): JSXElement {
  const [searchText, setSearchText] = createSignal("");
  const [tracks, setTracks] = createSignal<LyricsTrack[]>([]);
  const [hasSearched, setHasSearched] = createSignal(false);
  const [searching, setSearching] = createSignal(false);

  const [selected, setSelected] = createSignal<LyricsTrack | null>(null);
  // details from iTunes; undefined = loading, null = not found
  const [info, setInfo] = createSignal<TrackInfo | null | undefined>(undefined);
  // a problem with LRCLIB, shown in the list instead of as a popup
  const [problem, setProblem] = createSignal<
    { text: string; retry: () => void } | undefined
  >(undefined);

  const [options, setOptions] = createSignal<LyricsFilterOptions>(
    getLyricsFilterOptions(),
  );

  let searchAbort: AbortController | undefined;
  let infoAbort: AbortController | undefined;
  let lastQuery = "";

  onCleanup(() => {
    searchAbort?.abort();
    infoAbort?.abort();
  });

  const updateOptions = (patch: Partial<LyricsFilterOptions>): void => {
    const next = { ...options(), ...patch };
    setOptions(next);
    setLyricsFilterOptions(next);
  };

  // ---- searching ----

  /** @returns the found songs, `undefined` if the search was replaced or failed */
  const runSearch = async (
    query: string,
  ): Promise<LyricsTrack[] | undefined> => {
    if (query === lastQuery) return untrack(tracks);
    lastQuery = query;

    searchAbort?.abort();
    if (query === "") {
      batch(() => {
        setTracks([]);
        setHasSearched(false);
        setSearching(false);
      });
      return [];
    }

    const abort = new AbortController();
    searchAbort = abort;
    batch(() => {
      setSearching(true);
      setProblem(undefined);
    });
    try {
      const result = await searchTracks(query, abort.signal);
      if (abort.signal.aborted) return undefined;
      batch(() => {
        setTracks(result);
        setHasSearched(true);
      });
      return result;
    } catch (e) {
      if (abort.signal.aborted) return undefined;
      lastQuery = "";
      if (e instanceof RateLimitError || e instanceof ServerBusyError) {
        setProblem({
          text: lrclibProblemText(e),
          retry: () => void runSearch(query),
        });
      } else {
        showErrorNotification("Failed to search for songs", { error: e });
      }
      return undefined;
    } finally {
      if (searchAbort === abort) setSearching(false);
    }
  };

  // a search is only sent on enter, typing alone sends nothing to LRCLIB
  const submitSearch = (): void => {
    void runSearch(searchText().trim());
  };

  // ---- song details ----

  const selectTrack = (track: LyricsTrack): void => {
    infoAbort?.abort();
    const abort = new AbortController();
    infoAbort = abort;

    batch(() => {
      setSelected(track);
      setInfo(undefined);
    });
    fetchTrackInfo(track, abort.signal).then(
      (result) => {
        if (!abort.signal.aborted) setInfo(result);
      },
      () => {
        // details are optional, the lyrics are what matters
        if (!abort.signal.aborted) setInfo(null);
      },
    );
  };

  const backToResults = (): void => {
    infoAbort?.abort();
    setSelected(null);
    setInfo(undefined);
  };

  // ---- typing text ----

  const lyrics = (): string | null => selected()?.lyrics ?? null;

  const preview = createMemo(() => {
    const raw = lyrics();
    return raw === null ? "" : filterLyrics(raw, options());
  });

  const wordCount = createMemo(() => {
    const raw = lyrics();
    return raw === null ? 0 : lyricsToWords(raw, options()).length;
  });

  const foldableChars = createMemo(() => {
    const raw = lyrics();
    return raw === null ? [] : findFoldableChars(raw);
  });

  const isKept = (char: string): boolean =>
    options().keepChars.toLowerCase().includes(char);

  const toggleKept = (char: string): void => {
    const current = options().keepChars;
    updateOptions({
      keepChars: isKept(char)
        ? splitIntoCharacters(current)
            .filter((c) => c.toLowerCase() !== char)
            .join("")
        : current + char,
    });
  };

  const isOpenedFromCustomText = (): boolean => isModalInStack("CustomText");

  const startTest = (): void => {
    const raw = lyrics();
    if (raw === null) return;
    const words = lyricsToWords(raw, options());
    if (words.length === 0) {
      showNoticeNotification("Nothing left to type with the current filters");
      return;
    }

    if (isOpenedFromCustomText()) {
      // hand the text over to the custom text modal, so it can still be
      // edited and the mode and limit can be chosen there
      props.setChainedData({
        text: filterLyrics(raw, options()).replace(/^ +/gm, ""),
        pipeDelimiter: false,
      });
      hideModal("LyricsSearch");
      return;
    }

    CustomText.setMode("repeat");
    CustomText.setPipeDelimiter(false);
    CustomText.setText(words);
    CustomText.setLimitMode("word");
    CustomText.setLimitValue(words.length);

    if (getLoadedChallenge() !== null) {
      showNoticeNotification("Challenge cleared");
      setLoadedChallenge(null);
    }
    if (Config.mode !== "custom") {
      setConfig("mode", "custom");
    }
    PractiseWords.resetBefore();
    void restartTest();
    hideModalAndClearChain("LyricsSearch");
  };

  const handleBeforeShow = (isChained: boolean): void => {
    if (isChained) return;
    searchAbort?.abort();
    backToResults();
    lastQuery = "";
    setSearchText("");
    setTracks([]);
    setHasSearched(false);
    setSearching(false);
    setProblem(undefined);
    setOptions(getLyricsFilterOptions());
  };

  const emptyMessage = (): string => {
    if (searching()) return "Searching...";
    if (!hasSearched()) {
      return "Search for a song, artist or album and press enter.";
    }
    return "No songs with lyrics found";
  };

  const infoLine = (): string => {
    const track = selected();
    const details = info();
    if (track === null) return "";
    return [
      details?.album ?? (track.album === "" ? undefined : track.album),
      details?.genre,
      details?.year?.toString(),
    ]
      .filter((v) => v !== undefined && v !== "")
      .join(" · ");
  };

  return (
    <AnimatedModal
      id="LyricsSearch"
      focusFirstInput={true}
      beforeShow={handleBeforeShow}
      modalClass="max-w-[1000px] h-[80vh] grid-rows-[auto_1fr_auto]"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="text-2xl text-sub">Lyrics search</div>
        <div class="flex gap-2">
          <Show when={selected()}>
            <Button
              fa={{ icon: "fa-chevron-left", fixedWidth: true }}
              text="back to results"
              onClick={backToResults}
            />
          </Show>
        </div>
      </div>

      <Show
        when={selected()}
        fallback={
          <div class="grid min-h-0 grid-rows-[auto_1fr] gap-4">
            <input
              class={inputClass}
              type="text"
              placeholder="search by song, artist or album and press enter"
              autocomplete="off"
              maxLength={200}
              value={searchText()}
              onInput={(e) => setSearchText(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.isComposing) return;
                e.preventDefault();
                submitSearch();
              }}
            />
            <div class="grid content-baseline gap-2 overflow-y-auto">
              <Show when={problem()}>
                {(p) => (
                  <div class="flex items-center justify-between gap-4 rounded bg-sub-alt p-4">
                    <span class="text-sub">{p().text}</span>
                    <Button text="try again" onClick={() => p().retry()} />
                  </div>
                )}
              </Show>
              <Show
                when={tracks().length > 0}
                fallback={
                  <div class="p-4 text-center text-sub">{emptyMessage()}</div>
                }
              >
                <For each={tracks()}>
                  {(track) => (
                    <div
                      class="grid cursor-pointer gap-1 rounded p-4 transition-[background-color] duration-125 select-none hover:bg-sub-alt"
                      onClick={() => selectTrack(track)}
                    >
                      <div class="text-text">
                        {track.title}
                        <span class="text-sub"> - {track.artist}</span>
                      </div>
                      <div class="text-xs text-sub">{track.album}</div>
                    </div>
                  )}
                </For>
              </Show>
            </div>
          </div>
        }
      >
        {(track) => (
          <div class="grid min-h-0 gap-4 sm:grid-cols-[2fr_3fr]">
            <div class="grid content-baseline gap-4 overflow-y-auto pr-2">
              <div class="grid gap-2">
                <div class="text-xs text-sub">remove</div>
                <Toggle
                  label="section tags"
                  hint="Lines like [Chorus] or [Verse 2]"
                  checked={options().removeSectionHeaders}
                  onChange={(v) => updateOptions({ removeSectionHeaders: v })}
                />
                <Toggle
                  label="special characters"
                  hint="Symbols like * # @ ~ / | < > _ = + ^ %"
                  checked={options().removeSpecialChars}
                  onChange={(v) => updateOptions({ removeSpecialChars: v })}
                />
                <Toggle
                  label="punctuation"
                  hint={
                    '. , ! ? : ; " (keeps apostrophes and hyphens inside words)'
                  }
                  checked={options().removePunctuation}
                  onChange={(v) => updateOptions({ removePunctuation: v })}
                />
                <Toggle
                  label="repeated lines"
                  hint="Collapse identical lines that follow each other"
                  checked={options().removeRepeatedLines}
                  onChange={(v) => updateOptions({ removeRepeatedLines: v })}
                />
              </div>

              <div class="grid gap-2">
                <div class="text-xs text-sub">convert</div>
                <Toggle
                  label="fancy quotes and dashes to plain"
                  checked={options().normalizeTypography}
                  onChange={(v) => updateOptions({ normalizeTypography: v })}
                />
                <Toggle
                  label="accents (é to e, ç to c, ß to ss)"
                  checked={options().foldDiacritics}
                  onChange={(v) => updateOptions({ foldDiacritics: v })}
                />
                <Show
                  when={options().foldDiacritics && foldableChars().length > 0}
                >
                  <div class="grid gap-1">
                    <div class="text-xs text-sub">
                      click a character to keep it as it is
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <For each={foldableChars()}>
                        {(char) => (
                          <Button
                            variant="button"
                            active={isKept(char)}
                            text={
                              isKept(char)
                                ? `${char} kept`
                                : `${char} → ${getFoldReplacement(char)}`
                            }
                            onClick={() => toggleKept(char)}
                          />
                        )}
                      </For>
                    </div>
                  </div>
                </Show>
                <Toggle
                  label="lowercase"
                  checked={options().lowercase}
                  onChange={(v) => updateOptions({ lowercase: v })}
                />
              </div>

              <Choice
                label="brackets ( ) [ ] { }"
                value={options().brackets}
                options={[
                  { value: "keep", text: "keep" },
                  { value: "stripChars", text: "remove brackets" },
                  { value: "removeContent", text: "remove with content" },
                ]}
                onChange={(v) => updateOptions({ brackets: v })}
              />
              <Choice
                label="line breaks"
                value={options().lineBreaks}
                options={[
                  { value: "space", text: "space" },
                  { value: "enter", text: "enter" },
                ]}
                onChange={(v) => updateOptions({ lineBreaks: v })}
              />
              <Button
                text="reset filters"
                onClick={() => {
                  setOptions({ ...defaultLyricsFilterOptions });
                  setLyricsFilterOptions({ ...defaultLyricsFilterOptions });
                }}
              />
            </div>

            <div class="grid min-h-0 grid-rows-[auto_1fr] gap-2">
              <div>
                <div class="text-xl text-text">{track().title}</div>
                <div class="text-sub">{track().artist}</div>
                <Show when={infoLine() !== ""}>
                  <div class="text-sub">{infoLine()}</div>
                </Show>
                <div class="text-xs text-sub">
                  preview · {wordCount()} words
                </div>
              </div>
              <div class="overflow-y-auto rounded bg-sub-alt p-4 break-words whitespace-pre-wrap">
                {preview()}
                <Show when={preview() === ""}>
                  <span class="text-sub">Nothing left after filtering.</span>
                </Show>
              </div>
            </div>
          </div>
        )}
      </Show>

      <div class="grid items-center gap-2 sm:grid-cols-[1fr_auto]">
        <div class="text-xs text-sub">
          Songs and lyrics: LRCLIB · Details: Apple iTunes Search API. Lyrics
          are loaded for this session only and are not stored.
        </div>
        <Show when={selected()}>
          <Button
            fa={{
              icon: isOpenedFromCustomText() ? "fa-check" : "fa-play",
              fixedWidth: true,
            }}
            text={isOpenedFromCustomText() ? "use lyrics" : "start typing"}
            disabled={wordCount() === 0}
            onClick={startTest}
          />
        </Show>
      </div>
    </AnimatedModal>
  );
}
