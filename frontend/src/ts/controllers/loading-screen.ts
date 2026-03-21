import * as Misc from "../utils/misc";
import * as PageLoading from "../pages/loading";
import type Page from "../pages/page";
import type { LoadingOptions } from "../pages/page";

// global abort controller for keyframe promises
let keyframeAbortController: AbortController | null = null;

export async function showBlockingLoadingScreen({
  loadingOptions,
  totalDuration = Misc.applyReducedMotion(250),
}: {
  loadingOptions: LoadingOptions[];
  totalDuration?: number;
}): Promise<void> {
  PageLoading.page.element.show().setStyle({ opacity: "0" });
  await PageLoading.page.beforeShow({});

  const fillDivider = loadingOptions.length;
  const fillOffset = 100 / fillDivider;

  try {
    //void here to run the loading promise as soon as possible
    void PageLoading.page.element.promiseAnimate({
      opacity: "1",
      duration: totalDuration / 2,
    });

    for (let index = 0; index < loadingOptions.length; index++) {
      const currentOffset = fillOffset * index;
      const options = loadingOptions[index] as LoadingOptions;

      if (options.style === "bar") {
        await PageLoading.showBar();
        if (index === 0) {
          await PageLoading.updateBar(0, 0);
          PageLoading.updateText("");
        }
      } else {
        PageLoading.showSpinner();
      }

      if (options.style === "bar") {
        await getLoadingPromiseWithBarKeyframes(
          options,
          fillDivider,
          currentOffset,
        );
        void PageLoading.updateBar(100, 125);
        PageLoading.updateText("Done");
      } else {
        await options.loadingPromise();
      }
    }

    if (keyframeAbortController) {
      keyframeAbortController.abort();
      keyframeAbortController = null;
    }

    await PageLoading.page.element.promiseAnimate({
      opacity: "0",
      duration: totalDuration / 2,
    });

    await PageLoading.page.afterHide();
    PageLoading.page.element.hide();
  } catch (error) {
    if (keyframeAbortController) {
      keyframeAbortController.abort();
      keyframeAbortController = null;
    }

    throw error;
  }
}

async function getLoadingPromiseWithBarKeyframes(
  loadingOptions: Extract<
    NonNullable<Page<unknown>["loadingOptions"]>,
    { style: "bar" }
  >,
  fillDivider: number,
  fillOffset: number,
): Promise<void> {
  const loadingPromise = loadingOptions.loadingPromise();

  // Create abort controller for this keyframe sequence
  const localAbortController = new AbortController();
  keyframeAbortController = localAbortController;

  // Animate bar keyframes, but allow aborting if loading.promise finishes first or if globally aborted
  const keyframePromise = (async () => {
    for (const keyframe of loadingOptions.keyframes) {
      if (localAbortController.signal.aborted) break;
      if (keyframe.text !== undefined) {
        PageLoading.updateText(keyframe.text);
      }
      await PageLoading.updateBar(
        fillOffset + keyframe.percentage / fillDivider,
        keyframe.durationMs,
      );
    }
  })();

  // Wait for either the keyframes or the loading.promise to finish
  await Promise.race([
    keyframePromise,
    (async () => {
      await loadingPromise;
      localAbortController.abort();
    })(),
  ]);

  // Always wait for loading.promise to finish before continuing
  await loadingPromise;

  // Clean up the abort controller
  if (keyframeAbortController === localAbortController) {
    keyframeAbortController = null;
  }
}
