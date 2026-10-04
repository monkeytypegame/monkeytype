import { format } from "date-fns/format";
import { createMemo, JSXElement, Show } from "solid-js";

import { getIsScreenshotting, isAuthenticated } from "../../../../states/core";
import { getGlarsesMode } from "../../../../states/glarses-mode";
import { isResultShown, resultState } from "../../../../states/result";
import { getSnapshot } from "../../../../states/snapshot";
import { getLastEventLog, getLastResult } from "../../../../states/test";
import { restart, retrySavingResult } from "../../../../test/test-logic";
import { cn } from "../../../../utils/cn";
import { Button } from "../../../common/Button";
import { Fa } from "../../../common/Fa";
import { UserFlags } from "../../../common/UserFlags";
import { ResultButtons } from "./ResultButtons";
import { ResultChart } from "./ResultChart";
import { ResultReplay } from "./ResultReplay";
import { ResultStats } from "./ResultStats";
import { ResultWordsHistory } from "./ResultWordsHistory";

export function TestResult(): JSXElement {
  const lastTest = createMemo(() => {
    const result = getLastResult();
    const eventLog = getLastEventLog();
    return result !== null && eventLog !== null ? { result, eventLog } : null;
  });

  return (
    <div
      id="result"
      class={cn("content-grid full-width", {
        hidden: !isResultShown(),
        noBalloons: getIsScreenshotting(),
      })}
      tabIndex="-1"
    >
      <Show
        when={lastTest()}
        fallback={
          <>
            <div class="mx-auto">Missing last test result data.</div>
            <Button
              class="mx-auto mt-4 w-max px-4 py-2"
              text="Restart"
              fa={{ icon: "fa-chevron-right" }}
              onClick={() => void restart()}
            />
          </>
        }
      >
        {(test) => (
          <>
            <div class="wrapper">
              <Show when={getGlarsesMode()}>
                <div class="col-span-2 pb-8 text-center text-[2rem]">
                  <Fa icon="fa-check" />
                </div>
              </Show>
              <Show when={!getGlarsesMode()}>
                <ResultStats
                  result={test().result}
                  eventLog={test().eventLog}
                  hidden={getGlarsesMode()}
                />
                <ResultChart
                  result={test().result}
                  eventLog={test().eventLog}
                  hidden={getGlarsesMode()}
                />
              </Show>

              <div class="bottom">
                <Show when={!getGlarsesMode()}>
                  <ResultWordsHistory eventLog={test().eventLog} />

                  <ResultReplay />
                </Show>
                <Show when={resultState.canRetrySaving}>
                  <div class="grid w-full justify-center">
                    <Button
                      type="button"
                      class="mb-4 justify-self-center bg-error px-8 py-4 text-bg"
                      id="retrySavingResultButton"
                      onClick={() => void retrySavingResult()}
                      text="Retry saving result"
                      fa={{ icon: "fa-redo" }}
                    />
                  </div>
                </Show>
                <ResultButtons
                  glarses={getGlarsesMode()}
                  hidden={getIsScreenshotting()}
                />
              </div>
              <Show
                when={
                  !isAuthenticated() &&
                  !getGlarsesMode() &&
                  !getIsScreenshotting()
                }
              >
                <div class="loginTip">
                  <a href="/login" router-link>
                    Sign in
                  </a>{" "}
                  to save your result
                </div>
              </Show>
              <Show when={getIsScreenshotting()}>
                <Watermark />
              </Show>
            </div>
            <ResultAds />
          </>
        )}
      </Show>
    </div>
  );
}

// only mounted while screenshotting
function Watermark(): JSXElement {
  const date = format(new Date(), "dd MMM yyyy HH:mm");
  return (
    <div class="ssWatermark">
      <Show when={getSnapshot()}>
        {(snapshot) => (
          <>
            <span>
              {snapshot().name}
              <UserFlags {...snapshot()} iconsOnly />
            </span>
            <span class="pipe">|</span>
          </>
        )}
      </Show>
      <span>{date}</span>
      <span class="pipe">|</span>
      <span>monkeytype.com</span>
    </div>
  );
}

/**
 * Ad slots are filled and removed by the ad controllers, so the markup must stay static.
 */
function ResultAds(): JSXElement {
  return (
    <div class={cn("full-width mt-4", { hidden: getIsScreenshotting() })}>
      <div id="ad-result-wrapper" class="ad full-width advertisement ad-h">
        <div class="iconAndText">
          <div class="icon">
            <Fa icon="fa-ad" />
          </div>
          <div class="text textRight"></div>
        </div>
        <div id="ad-result"></div>
      </div>
      <div id="ad-result-small-wrapper" class="ad advertisement ad-h-s">
        <div class="icon small">
          <Fa icon="fa-ad" />
        </div>
        <div id="ad-result-small"></div>
      </div>
    </div>
  );
}
