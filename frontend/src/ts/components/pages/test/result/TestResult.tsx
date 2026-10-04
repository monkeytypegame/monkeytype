import { format } from "date-fns/format";
import { JSXElement, Show } from "solid-js";

import { getIsScreenshotting, isAuthenticated } from "../../../../states/core";
import { getGlarsesMode } from "../../../../states/glarses-mode";
import { isResultShown, resultState } from "../../../../states/result";
import { getSnapshot } from "../../../../states/snapshot";
import { retrySavingResult } from "../../../../test/test-logic";
import { cn } from "../../../../utils/cn";
import { Fa } from "../../../common/Fa";
import { UserFlags } from "../../../common/UserFlags";
import { ResultButtons } from "./ResultButtons";
import { ResultChart } from "./ResultChart";
import { ResultReplay } from "./ResultReplay";
import { ResultStats } from "./ResultStats";
import { ResultWordsHistory } from "./ResultWordsHistory";

export function TestResult(): JSXElement {
  return (
    <div
      id="result"
      class={cn("content-grid full-width", {
        hidden: !isResultShown(),
        noBalloons: getIsScreenshotting(),
      })}
      tabIndex="-1"
    >
      <div class="wrapper">
        <Show when={getGlarsesMode()}>
          <div class="col-span-2 pb-8 text-center text-[2rem]">
            <Fa icon="fa-check" />
          </div>
        </Show>
        <ResultStats hidden={getGlarsesMode()} />
        <ResultChart hidden={getGlarsesMode()} />
        <div class="bottom">
          <Show when={!getGlarsesMode()}>
            <ResultWordsHistory />
            <ResultReplay />
          </Show>
          <Show when={resultState.canRetrySaving}>
            <button
              type="button"
              id="retrySavingResultButton"
              class="danger"
              onClick={() => void retrySavingResult()}
            >
              <Fa icon="fa-redo" /> Retry saving result
            </button>
          </Show>
          <ResultButtons
            glarses={getGlarsesMode()}
            hidden={getIsScreenshotting()}
          />
        </div>
        <Show
          when={
            !isAuthenticated() && !getGlarsesMode() && !getIsScreenshotting()
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
