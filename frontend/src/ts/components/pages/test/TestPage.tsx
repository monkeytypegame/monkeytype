import { JSXElement, onMount } from "solid-js";

import { initResultChart } from "../../../controllers/chart-controller";
import { initInputListeners } from "../../../input/listeners";
import * as Caret from "../../../test/caret";
import * as PaceCaret from "../../../test/pace-caret";
import * as TestUI from "../../../test/test-ui";
import { ElementWithUtils } from "../../../utils/dom";
import { CapsWarning } from "./CapsWarning";
import { CompositionDisplay } from "./CompositionDisplay";
import { Keymap } from "./Keymap";
import { LiveStatsMini } from "./live-stats/LiveStatsMini";
import { LiveStatsTextBottom } from "./live-stats/LiveStatsTextBottom";
import { LiveStatsTextTop } from "./live-stats/LiveStatsTextTop";
import { TestModesNotice } from "./modes-notice/TestModesNotice";
import { Monkey } from "./Monkey";
import { OutOfFocusWarning } from "./OutOfFocusWarning";
import { Premid } from "./Premid";
import { TestConfig } from "./TestConfig";

/**
 * Renders the children of the static `.page.pageTest` element.
 * Internals are still vanilla - this only owns the markup and binds the
 * vanilla listeners once it exists. Must stay mounted for the app's lifetime.
 */
export function TestPage(): JSXElement {
  let wordsWrapperRef: HTMLDivElement | undefined;
  let wordsRef: HTMLDivElement | undefined;
  let caretRef: HTMLDivElement | undefined;
  let paceCaretRef: HTMLDivElement | undefined;

  onMount(() => {
    if (
      wordsWrapperRef === undefined ||
      wordsRef === undefined ||
      caretRef === undefined ||
      paceCaretRef === undefined
    ) {
      throw new Error("TestPage refs not set");
    }
    const words = new ElementWithUtils(wordsRef);
    const wordsWrapper = new ElementWithUtils(wordsWrapperRef);
    Caret.initElement({
      caret: new ElementWithUtils(caretRef),
      words,
      wordsWrapper,
    });
    PaceCaret.initElement({
      caret: new ElementWithUtils(paceCaretRef),
      words,
      wordsWrapper,
    });
    initResultChart();
    initInputListeners();
    TestUI.init();
  });

  return (
    <>
      <div class="full-width">
        <TestConfig />
      </div>

      <div id="testInitFailed" class="content-grid hidden">
        <div class="message">
          <div class="text">
            Test initialization failed. Please try different settings or
            refreshing the page. If the problem persists, please contact
            support.
          </div>
          <div class="error"></div>
          <button type="button" class="active restart">
            <i class="fas fa-fw fa-redo-alt"></i> Restart
          </button>
        </div>
      </div>
      <div id="typingTest" class="content-grid full-width-padding">
        <div class="tribeBars hidden"></div>
        <div>
          <CapsWarning />
        </div>
        <div id="memoryTimer">Time left to memorise all words: 0s</div>
        <div id="layoutfluidTimer">Time left to memorise all words: 0s</div>
        <div>
          <TestModesNotice />
        </div>

        <div>
          <LiveStatsTextTop />
        </div>
        <div class="full-width">
          <LiveStatsMini />
        </div>
        <div class="tribeCountdown hidden"></div>
        <div
          id="wordsWrapper"
          ref={(el) => (wordsWrapperRef = el)}
          class="content-grid full-width"
          translate="no"
        >
          <textarea
            id="wordsInput"
            class="full-width"
            autocomplete="off"
            // oxlint-disable-next-line react/no-unknown-property
            autocapitalize="off"
            // oxlint-disable-next-line react/no-unknown-property
            autocorrect="off"
            data-gramm="false"
            data-gramm_editor="false"
            data-enable-grammarly="false"
            data-bwignore=""
            data-1p-ignore=""
            data-lpignore="true"
            data-form-type="other"
            // oxlint-disable-next-line react/no-unknown-property
            spellcheck={false}
          ></textarea>
          <div class="contents">
            <OutOfFocusWarning />
          </div>
          <div
            id="paceCaret"
            ref={(el) => (paceCaretRef = el)}
            class="full-width default hidden"
          ></div>
          <div
            id="caret"
            ref={(el) => (caretRef = el)}
            class="full-width default"
          ></div>
          <div
            id="words"
            ref={(el) => (wordsRef = el)}
            class="full-width"
          ></div>
        </div>

        <div id="tribeDeltaBar" class="hidden">
          <div class="behind">
            <div class="bar"></div>
          </div>
          <div class="ahead">
            <div class="bar"></div>
          </div>
        </div>

        <div>
          <CompositionDisplay />
        </div>
        <div>
          <Keymap />
        </div>
        <div>
          <Monkey />
        </div>

        <button
          type="button"
          id="restartTestButton"
          aria-label="Restart Test"
          data-balloon-pos="down"
          class="text"
        >
          <i class="fas fa-fw fa-redo-alt"></i>
        </button>
        <div>
          <LiveStatsTextBottom />
        </div>
        <div>
          <Premid />
        </div>
      </div>
      <div class="loading hidden">
        <i class="fas fa-circle-notch fa-spin"></i>
      </div>
      <TestResult />
    </>
  );
}

function TestResult(): JSXElement {
  return (
    <div id="result" class="content-grid full-width hidden" tabIndex="-1">
      <div class="wrapper">
        <div id="tribeResults" class="hidden">
          <table>
            <thead>
              <tr>
                <td></td>
                <td>
                  position
                  <br />
                  <span>points</span>
                </td>
                <td></td>
                <td>
                  wpm
                  <br />
                  <span>accuracy</span>
                </td>
                <td>
                  raw
                  <br />
                  <span>consistency</span>
                </td>
                <td>
                  characters
                  <br />
                  <span>other</span>
                </td>
                <td></td>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
          <div class="timer invisible">timer</div>
        </div>
        <div class="stats">
          <div class="group wpm">
            <div class="top">
              <div class="text">wpm</div>
              <div
                class="crown hidden"
                aria-label=""
                data-balloon-pos="up"
                data-balloon-length="medium"
              >
                <i class="fas fa-question"></i>
                <i class="fas fa-crown"></i>
                <i class="fas fa-slash"></i>
                <i class="fas fa-exclamation-triangle"></i>
              </div>
            </div>
            <div class="bottom" aria-label="" data-balloon-pos="up">
              -
            </div>
          </div>
          <div class="group acc">
            <div class="top">acc</div>
            <div class="bottom" aria-label="" data-balloon-pos="up">
              -
            </div>
          </div>
        </div>
        <div class="stats morestats">
          <div class="group testType">
            <div class="top">test type</div>
            <div class="bottom">-</div>
            <div class="tags hidden" style={{ "margin-top": "0.5rem" }}>
              <div class="top">
                <span>tags</span>
                <div
                  class="textButton editTagsButton"
                  data-result-id=""
                  data-active-tag-ids=""
                  aria-label="Edit tags"
                  role="button"
                  data-balloon-pos="right"
                >
                  <i class="fas fa-pen fa-fw"></i>
                </div>
              </div>
              <div class="bottom">-</div>
            </div>
          </div>
          <div class="group info">
            <div class="top">other</div>
            <div class="bottom">-</div>
          </div>

          <div class="group raw">
            <div class="top">raw</div>
            <div class="bottom" aria-label="" data-balloon-pos="up">
              -
            </div>
          </div>
          <div class="group key">
            <div class="top">characters</div>
            <div
              class="bottom"
              aria-label={"correct\nincorrect\nextra\nmissed"}
              data-balloon-break=""
              data-balloon-pos="up"
            >
              -
            </div>
          </div>

          <div class="group flat consistency">
            <div class="top">consistency</div>
            <div class="bottom" aria-label="" data-balloon-pos="up">
              2 -
            </div>
          </div>
          <div class="group time">
            <div class="top">time</div>
            <div class="bottom" aria-label="" data-balloon-pos="up">
              <div class="text">-</div>
              <div class="afk"></div>
              <div class="timeToday"></div>
            </div>
          </div>

          <div class="group dailyLeaderboard hidden">
            <div class="top">daily leaderboard</div>
            <div
              id="dailyLeaderboardRank"
              aria-label="Show daily leaderboard"
              data-balloon-pos="up"
              class="bottom"
            >
              -
            </div>
          </div>

          <div class="group source hidden">
            <div class="top">
              <span style={{ "margin-right": "0.5em" }}>source</span>
              <span
                id="reportQuoteButton"
                class="textButton hidden"
                aria-label="Report quote"
                data-balloon-pos="up"
              >
                <i class="icon fas fa-fw fa-flag"></i>
              </span>
              <span
                id="favoriteQuoteButton"
                class="textButton hidden"
                aria-label="Favorite quote"
                data-balloon-pos="up"
              >
                <i class="icon far fa-fw fa-heart"></i>
              </span>
              <span
                id="rateQuoteButton"
                class="textButton hidden"
                aria-label="Rate quote"
                data-balloon-pos="up"
              >
                <i class="icon far fa-fw fa-star"></i>
                <span class="rating"></span>
              </span>
            </div>
            <div class="bottom">-</div>
          </div>
        </div>
        <div class="chart">
          <div class="chartLegend">
            <button
              type="button"
              class="text active"
              tabIndex="-1"
              data-id="scale"
            >
              <i class="fas fa-chart-line"></i>
              <div class="text">scale</div>
            </button>
            <button type="button" class="text" tabIndex="-1" data-id="pbLine">
              <i class="fas fa-crown"></i>
              <div class="text">pb</div>
            </button>
            <button
              type="button"
              class="text"
              tabIndex="-1"
              data-id="tagPbLine"
            >
              <i class="fas fa-tag"></i>
              <div class="text">tag pb</div>
            </button>
            <button type="button" class="text" tabIndex="-1" data-id="raw">
              <div class="line dashed"></div>
              <div class="text">raw</div>
            </button>
            <button type="button" class="text" tabIndex="-1" data-id="burst">
              <div class="line"></div>
              <div class="text">burst</div>
            </button>
            <button type="button" class="text" tabIndex="-1" data-id="errors">
              <i class="fas fa-times"></i>
              <div class="text">errors</div>
            </button>
          </div>
          <canvas id="wpmChart"></canvas>
        </div>
        <div class="bottom">
          <div id="resultWordsHistory" class="hidden">
            <div class="title">
              <span>input history</span>
              <button
                type="button"
                id="copyWordsListButton"
                class="textButton"
                aria-label="Copy words list"
                data-balloon-pos="up"
                style={{ display: "inline-block" }}
                tabIndex="-1"
              >
                <i class="fas fa-fw fa-align-left"></i>
              </button>
              <button
                type="button"
                id="copyMissedWordsListButton"
                class="textButton"
                aria-label="Copy missed words list"
                data-balloon-pos="up"
                tabIndex="-1"
              >
                <i class="fas fa-fw fa-times"></i>
              </button>
              <button
                type="button"
                id="copySlowWordsListButton"
                class="textButton"
                aria-label="Copy slow words list"
                data-balloon-pos="up"
                tabIndex="-1"
              >
                <i class="fas fa-fw fa-tachometer-alt"></i>
              </button>
              <button
                type="button"
                id="toggleBurstHeatmap"
                class="textButton"
                aria-label="Toggle burst heatmap"
                data-balloon-pos="up"
                style={{ display: "inline-block" }}
                tabIndex="-1"
              >
                <i class="fas fa-fw fa-fire-alt"></i>
              </button>
              <div class="heatmapLegend hidden">
                <div class="boxes">
                  <div class="box box0"></div>
                  <div class="box box1"></div>
                  <div class="box box2"></div>
                  <div class="box box3"></div>
                  <div class="box box4"></div>
                </div>
              </div>
            </div>
            <div class="words"></div>
          </div>
          <div id="resultReplay" class="hidden">
            <div class="title">
              watch replay{" "}
              <button
                type="button"
                id="playpauseReplayButton"
                class="textButton"
                aria-label="Start replay"
                data-balloon-pos="up"
                style={{ display: "inline-block" }}
                tabIndex="-1"
              >
                <i class="fas fa-play"></i>
              </button>
              <p id="replayStats">0s</p>
            </div>
            <div id="replayWordsWrapper">
              <div id="replayWords" class="words"></div>
            </div>
          </div>
          <button
            type="button"
            id="retrySavingResultButton"
            class="danger hidden"
          >
            <i class="fas fa-redo"></i> Retry saving result
          </button>
          <div class="buttons">
            <button
              type="button"
              class="text hidden"
              id="readyButton"
              aria-label="Ready"
              role="button"
              data-balloon-pos="down"
            >
              <i class="fas fa-fw fa-check"></i>
            </button>
            <button
              type="button"
              class="hidden"
              id="queueAgainButton"
              aria-label="Queue again"
              role="button"
              data-balloon-pos="down"
            >
              <i class="fas fa-fw fa-satellite-dish"></i>
            </button>
            <button
              type="button"
              class="text"
              id="nextTestButton"
              aria-label="Next test"
              role="button"
              data-balloon-pos="down"
            >
              <i class="fas fa-fw fa-chevron-right"></i>
            </button>
            <button
              type="button"
              class="text"
              id="restartTestButtonWithSameWordset"
              aria-label="Repeat test"
              role="button"
              data-balloon-pos="down"
            >
              <i class="fas fa-fw fa-sync-alt"></i>
            </button>
            <button
              type="button"
              class="text"
              id="practiseWordsButton"
              aria-label="Practice words"
              role="button"
              data-balloon-pos="down"
            >
              <i class="fas fa-fw fa-exclamation-triangle"></i>
            </button>
            <button
              type="button"
              class="text"
              id="showWordHistoryButton"
              aria-label="Toggle words history"
              role="button"
              data-balloon-pos="down"
            >
              <i class="fas fa-fw fa-align-left"></i>
            </button>
            <button
              type="button"
              class="text"
              id="watchReplayButton"
              aria-label="Watch replay"
              role="button"
              data-balloon-pos="down"
            >
              <i class="fas fa-fw fa-backward"></i>
            </button>
            <button
              type="button"
              class="text"
              id="saveScreenshotButton"
              aria-label={
                "Copy screenshot to clipboard\n(shift click to download)"
              }
              role="button"
              data-balloon-pos="down"
              data-balloon-break=""
            >
              <i class="far fa-fw fa-image"></i>
            </button>
          </div>
          <div class="loginTip">
            <a href="/login" router-link>
              Sign in
            </a>{" "}
            to save your result
          </div>
        </div>
        <div id="tribeResultBottom" class="hidden">
          <div class="chat">
            <div class="title">chat</div>
            <div class="messages"></div>
            <div class="input">
              <div class="emojiSuggestion hidden"></div>
              <input
                type="text"
                placeholder="Send a message (press / to focus)"
              />
            </div>
            <div class="whoIsTyping"></div>
          </div>
          <div class="buttons">
            <button type="button" class="startTestButton">
              <i class="fas fa-chevron-right"></i> Next test
            </button>
            <button type="button" class="backToLobbyButton">
              <i class="fas fa-home"></i> Back to lobby
            </button>
            <div class="readyButtonGroup">
              <button type="button" class="userReadyButton">
                <i class="fas fa-check"></i> Ready
              </button>
              <button
                type="button"
                class="autoReadyButton"
                data-balloon-pos="left"
                aria-label="Auto ready"
              >
                <i class="fas fa-fw fa-magic"></i>
              </button>
            </div>
            <button type="button" class="userAfkButton">
              <i class="fas fa-mug-hot"></i> Take a break
            </button>
            <button type="button" class="leaveRoomButton">
              <i class="fas fa-door-open"></i> Leave room
            </button>
          </div>
          <div class="userlist">
            <div class="title">users</div>
            <div class="list"></div>
          </div>
          <div class="inviteLink">
            <div class="code">
              <div class="title">room code</div>
              <button
                type="button"
                class="text"
                aria-label="Click to copy"
                data-balloon-pos="up"
              ></button>
            </div>
            <button type="button" class="link textButton"></button>
          </div>
        </div>
        <div class="ssWatermark hidden">monkeytype.com</div>
      </div>
      <div class="full-width" style={{ "margin-top": "1rem" }}>
        <div id="ad-result-wrapper" class="ad full-width advertisement ad-h">
          <div class="iconAndText">
            <div class="icon">
              <i class="fas fa-ad"></i>
            </div>
            <div class="text textRight"></div>
          </div>
          <div id="ad-result"></div>
        </div>
        <div id="ad-result-small-wrapper" class="ad advertisement ad-h-s">
          <div class="icon small">
            <i class="fas fa-ad"></i>
          </div>
          <div id="ad-result-small"></div>
        </div>
      </div>
    </div>
  );
}
