import { Link } from "@tanstack/solid-router";
import { format } from "date-fns/format";
import {
  createMemo,
  JSXElement,
  Match,
  onCleanup,
  onMount,
  Show,
  Switch,
} from "solid-js";

import { getConfig } from "../../../../config/store";
import { useRefWithUtils } from "../../../../hooks/useRefWithUtils";
import { getAdBlock, getCookieBlocker } from "../../../../states/ads";
import { getIsScreenshotting, isAuthenticated } from "../../../../states/core";
import { getGlarsesMode } from "../../../../states/glarses-mode";
import { resultState } from "../../../../states/result";
import { getSnapshot } from "../../../../states/snapshot";
import { getLastEventLog, getLastResult } from "../../../../states/test";
import { restartTest, retrySavingResult } from "../../../../test/test-logic";
import { setResultElement } from "../../../../test/test-ui";
import { cn } from "../../../../utils/cn";
import {
  applyReducedMotion,
  scrollToCenterOrTop,
} from "../../../../utils/misc";
import { AdIcon } from "../../../common/AdIcon";
import { adSlotClass } from "../../../common/Advertisement";
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

  const [resultRef, resultEl] = useRefWithUtils<HTMLDivElement>();
  onMount(() => {
    const el = resultEl();
    if (el === undefined) return;
    // test-ui fades it out on restartTest
    setResultElement(el);
    onCleanup(() => setResultElement(undefined));

    void el.promiseAnimate({
      opacity: [0, 1],
      duration: applyReducedMotion(125),
    });
    scrollToCenterOrTop(el.native);
  });

  return (
    <div id="result" ref={resultRef} class={cn("content-grid full-width")}>
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
              onClick={() => void restartTest()}
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
        <Link to="/login">Sign in</Link> to save your result
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
 * Ad slots are filled by the ad controllers, so the markup must stay static.
 */
function ResultAds(): JSXElement {
  return (
    <div
      class={cn("full-width mt-4", {
        hidden: getIsScreenshotting() || getConfig.ads === "off",
      })}
    >
      <div
        id="ad-result-wrapper"
        class={cn(adSlotClass("h"), "full-width mx-auto")}
      >
        <div class="grid grid-cols-[auto_1fr] items-center justify-center gap-4 justify-self-center">
          <AdIcon class="h-auto w-auto" />
          <div class="text-base text-sub">
            <Switch>
              <Match when={getAdBlock()}>
                Using an ad blocker? No worries
                <div class="text-[0.7rem]">
                  We understand ads can be annoying
                  <br />
                  You can <i>disable all ads</i> in the settings
                </div>
              </Match>
              <Match when={getCookieBlocker()}>
                Ads not working? Ooops
                <div class="text-[0.7rem]">
                  You may have a cookie popup blocker enabled - ads will not
                  show without your consent
                  <br />
                  You can also <i>disable all ads</i> in the settings if you
                  wish
                </div>
              </Match>
            </Switch>
          </div>
        </div>
        <div id="ad-result"></div>
      </div>
      <div
        id="ad-result-small-wrapper"
        class={cn(adSlotClass("hs"), "mx-auto")}
      >
        <AdIcon small />
        <div id="ad-result-small"></div>
      </div>
    </div>
  );
}
