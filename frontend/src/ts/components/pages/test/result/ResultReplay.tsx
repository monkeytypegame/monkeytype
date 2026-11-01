import { For, JSXElement } from "solid-js";
import { Dynamic } from "solid-js/web";

import { getIsScreenshotting } from "../../../../states/core";
import { cn } from "../../../../utils/cn";
import { AnimeShow } from "../../../common/anime";
import { buildBalloonHtmlProperties } from "../../../common/Balloon";
import { Fa } from "../../../common/Fa";
import { jumpToLetter, replayState, togglePlayback } from "./replay";
import { letterClass, wordClass, wordsClass } from "./result-words";

const playButtonText = {
  start: "Start replay",
  playing: "Pause replay",
  paused: "Resume replay",
} as const;

export function ResultReplay(): JSXElement {
  return (
    // hidden instead of unmounted so screenshots can restore it right away
    <div class={getIsScreenshotting() ? "hidden" : undefined}>
      <AnimeShow when={replayState.open} slide duration={250}>
        <div id="resultReplay" class="mb-4 text-sub">
          <div class="mb-1 flex items-center select-none">
            watch replay{" "}
            <button
              type="button"
              id="playpauseReplayButton"
              class="textButton ml-[0.5em] inline-block px-[0.25em] py-0"
              tabIndex="-1"
              {...buildBalloonHtmlProperties({
                text: playButtonText[replayState.playState],
              })}
              onClick={togglePlayback}
            >
              <Fa
                icon={
                  replayState.playState === "playing" ? "fa-pause" : "fa-play"
                }
              />
            </button>
            <p id="replayStats" class="m-0 ml-[0.5em] inline-block text-main">
              {replayState.stats}
            </p>
          </div>
          <div id="replayWordsWrapper">
            <div
              id="replayWords"
              class={cn(wordsClass(), "cursor-pointer select-none")}
            >
              <For each={replayState.words}>
                {(word, wordIndex) => (
                  <div class={cn(wordClass, { error: word.error })}>
                    <For each={word.letters}>
                      {(letter, letterIndex) => (
                        <Dynamic
                          component="letter"
                          class={letterClass(letter)}
                          onClick={() =>
                            jumpToLetter(wordIndex(), letterIndex())
                          }
                        >
                          {letter.char}
                        </Dynamic>
                      )}
                    </For>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      </AnimeShow>
    </div>
  );
}
