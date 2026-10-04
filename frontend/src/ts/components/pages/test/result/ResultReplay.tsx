import { For, JSXElement } from "solid-js";
import { Dynamic } from "solid-js/web";

import { getIsScreenshotting } from "../../../../states/core";
import { isResultWordsJoiningScript } from "../../../../states/result";
import { isLanguageRightToLeft } from "../../../../states/test";
import { cn } from "../../../../utils/cn";
import { AnimeShow } from "../../../common/anime";
import { buildBalloonHtmlProperties } from "../../../common/Balloon";
import { Fa } from "../../../common/Fa";
import { jumpToLetter, replayState, togglePlayback } from "./replay";

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
        <div id="resultReplay">
          <div class="title">
            watch replay{" "}
            <button
              type="button"
              id="playpauseReplayButton"
              class="textButton inline-block"
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
            <p id="replayStats">{replayState.stats}</p>
          </div>
          <div id="replayWordsWrapper">
            <div
              id="replayWords"
              class={cn("words", {
                rightToLeftTest: isLanguageRightToLeft(),
                joiningScript: isResultWordsJoiningScript(),
              })}
            >
              <For each={replayState.words}>
                {(word, wordIndex) => (
                  <div class={cn("word", { error: word.error })}>
                    <For each={word.letters}>
                      {(letter, letterIndex) => (
                        <Dynamic
                          component="letter"
                          class={cn(letter.state, { extra: letter.extra })}
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
