import { format } from "date-fns/format";
import { createMemo, JSXElement, Show } from "solid-js";

import { getConfig } from "../../../../config/store";
import { getIsScreenshotting, isAuthenticated } from "../../../../states/core";
import { getGlarsesMode } from "../../../../states/glarses-mode";
import { resultState } from "../../../../states/result";
import { getSnapshot } from "../../../../states/snapshot";
import { getLastEventLog, getLastResult } from "../../../../states/test";
import { restart, retrySavingResult } from "../../../../test/test-logic";
import { cn } from "../../../../utils/cn";
import { Button } from "../../../common/Button";
import { Fa } from "../../../common/Fa";
import { UserFlags } from "../../../common/UserFlags";
import { ResultButtons } from "./ResultButtons";
import { ResultChart } from "./ResultChart";
import { ResultMainStats } from "./ResultMainStats";
import { ResultReplay } from "./ResultReplay";
import { ResultSecondaryStats } from "./ResultSecondaryStats";
import { ResultWordsHistory } from "./ResultWordsHistory";

export function TestResult(): JSXElement {
  const lastTest = createMemo(() => {
    const result = getLastResult();
    const eventLog = getLastEventLog();
    return result !== null && eventLog !== null ? { result, eventLog } : null;
  });

  return (
    <div id="result" class={cn("content-grid full-width")}>
      <Show when={getGlarsesMode()}>
        <div class="col-span-full pb-8 text-center text-[2rem]">
          <Fa icon="fa-check" />
        </div>
      </Show>
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
          <div id="resultScreenshotTarget">
            <Show when={!getGlarsesMode()}>
              <div class={cn("mb-4 grid gap-4 md:grid-cols-[auto_1fr]")}>
                <ResultMainStats
                  result={test().result}
                  eventLog={test().eventLog}
                />
                <ResultChart
                  result={test().result}
                  eventLog={test().eventLog}
                />
              </div>
              <ResultSecondaryStats result={test().result} />
              <ResultWordsHistory eventLog={test().eventLog} />
              <ResultReplay />
              <RetrySavingButton />
              <LoginPrompt />
            </Show>
            <ResultButtons glarses={getGlarsesMode()} />

            <Watermark />
          </div>
        )}
      </Show>
      <ResultAds />
    </div>
  );
}

function LoginPrompt(): JSXElement {
  return (
    <Show when={!isAuthenticated() && !getIsScreenshotting()}>
      <div class="mb-4 text-center text-sub">
        <a href="/login" router-link>
          Sign in
        </a>{" "}
        to save your result
      </div>
    </Show>
  );
}

function RetrySavingButton(): JSXElement {
  return (
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
  );
}

function Watermark(): JSXElement {
  return (
    <Show when={getIsScreenshotting()}>
      {(_) => {
        // created per screenshot so the date is current
        const date = format(new Date(), "dd MMM yyyy HH:mm");
        return (
          <div class="col-span-full flex flex-wrap justify-end gap-x-[1em] text-[1.25rem] text-sub [&_.fas]:ml-[0.33em]">
            <Show when={getSnapshot()}>
              {(snapshot) => (
                <>
                  <span>
                    {snapshot().name}
                    <UserFlags {...snapshot()} iconsOnly />
                  </span>
                  <span>|</span>
                </>
              )}
            </Show>
            <span>{date}</span>
            <span>|</span>
            <span>monkeytype.com</span>
          </div>
        );
      }}
    </Show>
  );
}

/**
 * Ad slots are filled and removed by the ad controllers, so the markup must stay static.
 */
function ResultAds(): JSXElement {
  return (
    <div
      class={cn("full-width mt-4", {
        hidden: getIsScreenshotting() || getConfig.ads === "off",
      })}
    >
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
