import { getFunbox } from "@monkeytype/funbox";
import { roundTo2 } from "@monkeytype/util/numbers";

import {
  __nonReactive as tagsNonReactive,
  getLocalTagPB,
  saveLocalTagPB,
} from "../collections/tags";
import * as DB from "../db";
import Format from "../singletons/format";
import { hideCrown, ResultTag, resultState, showCrown } from "../states/result";
import { CompletedResult } from "../states/test";

export type PbEligibility = {
  value: boolean;
  reason?: string;
};

/**
 * null when pbs don't apply at all (quote mode or the result isn't saved)
 */
export function getPbEligibility(
  result: CompletedResult,
  dontSave: boolean,
): PbEligibility | null {
  if (result.mode === "quote" || dontSave) return null;

  const funboxesOk =
    result.funbox.length === 0 ||
    getFunbox(result.funbox).every((f) => f?.canGetPb);
  // allow stopOnError:letter to be PB only if 100% accuracy, since it doesn't affect gameplay
  const stopOnLetterTriggered = result.stopOnLetter && result.acc < 100;

  if (!funboxesOk) return { value: false, reason: "funbox" };
  if (stopOnLetterTriggered) return { value: false, reason: "stop on letter" };
  if (result.bailedOut) return { value: false, reason: "bailed out" };
  return { value: true };
}

/**
 * Shows the local (unconfirmed) pb crown. The server response later confirms it.
 */
export function updateCrown(
  result: CompletedResult,
  canGet: PbEligibility | null,
): void {
  if (canGet === null) {
    hideCrown();
    return;
  }

  console.debug("Result can get PB:", canGet.value, canGet.reason ?? "");

  const localPb = DB.getLocalPB(
    result.mode,
    result.mode2,
    result.punctuation,
    result.numbers,
    result.language,
    result.difficulty,
    result.lazyMode,
    canGet.value ? getFunbox(result.funbox) : [],
  );
  const pbDiff = result.wpm - (localPb?.wpm ?? 0);
  console.debug("Local PB", localPb, "diff", pbDiff);
  const diffText = Format.typingSpeed(pbDiff, { showDecimalPlaces: true });

  if (canGet.value) {
    if (pbDiff <= 0) {
      hideCrown();
    } else {
      //show half crown as the pb is not confirmed by the server
      showCrown("pending", `+${diffText}`);
    }
  } else if (pbDiff <= 0) {
    showCrown(
      "warning",
      `This result is not eligible for a new PB (${canGet.reason})`,
      true,
    );
  } else {
    showCrown(
      "ineligible",
      `You could've gotten a new PB (+${diffText}), but your config does not allow it (${canGet.reason})`,
      true,
    );
  }
}

export function showErrorCrownIfNeeded(): void {
  if (!resultState.crown.visible || resultState.crown.type !== "pending") {
    return;
  }
  showCrown(
    "error",
    `Local PB data is out of sync with the server - please refresh (pb mismatch)`,
    true,
  );
}

/**
 * Builds the active tags shown on the result, saving new local tag pbs along the way.
 */
export function getResultTags(
  result: CompletedResult,
  canGet: PbEligibility | null,
): ResultTag[] {
  const pbAllowed = canGet?.value === true;

  return tagsNonReactive.getActiveTags().map((tag) => {
    const tpb = getLocalTagPB(
      tag._id,
      result.mode,
      result.mode2,
      result.punctuation,
      result.numbers,
      result.language,
      result.difficulty,
      result.lazyMode,
    );
    const resultTag: ResultTag = {
      id: tag._id,
      isPb: false,
      balloon: `PB: ${tpb}`,
    };
    if (!pbAllowed) return resultTag;

    if (tpb < result.wpm) {
      //new pb for that tag
      saveLocalTagPB(
        tag._id,
        result.mode,
        result.mode2,
        result.punctuation,
        result.numbers,
        result.language,
        result.difficulty,
        result.lazyMode,
        result.wpm,
        result.acc,
        result.rawWpm,
        result.consistency,
      );
      resultTag.isPb = true;
      resultTag.balloon = `+${roundTo2(result.wpm - tpb)}`;
    } else {
      resultTag.chartPb = tpb;
    }
    return resultTag;
  });
}
