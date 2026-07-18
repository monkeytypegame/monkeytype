import { CompletedEvent } from "@monkeytype/schemas/results";
import { Challenge, ChallengeSettings, getChallenge } from ".";
import { areUnsortedArraysEqual } from "@monkeytype/util/arrays";
import { typedKeys } from "@monkeytype/util/objects";

export type VerifySuccess = { state: "success"; challenge: Challenge };
export type VerifyError = {
  state: "error";
  errorMessage: string;
  error?: unknown;
};
export type VerifyFailed = { state: "failed"; reason: string };
export function verify(
  result: CompletedEvent,
): VerifySuccess | VerifyError | VerifyFailed {
  if (result.challenge === undefined) {
    return { state: "error", errorMessage: "challenge missing" };
  }

  const loadedChallenge = getChallenge(result.challenge);

  if (
    loadedChallenge === undefined ||
    loadedChallenge.settings?.requirements === undefined
  ) {
    return {
      state: "error",
      errorMessage: "challenge unknown or missing settings",
    };
  }

  try {
    const afk = (result.afkDuration / result.testDuration) * 100;

    if (afk > 10) {
      return {
        state: "failed",
        reason: `Challenge failed: AFK time is greater than 10%`,
      };
    }

    if (loadedChallenge.settings?.requirements === undefined) {
      return { state: "error", errorMessage: "challenge missing settings" };
    }

    let requirementsMet = true;
    const failReasons: string[] = [];
    for (const requirementType of typedKeys(
      loadedChallenge.settings.requirements,
    )) {
      const [passed, requirementFailReasons] = verifyRequirement(
        result,
        loadedChallenge.settings.requirements,
        requirementType,
      );
      if (!passed) {
        requirementsMet = false;
      }
      failReasons.push(...requirementFailReasons);
    }
    if (requirementsMet) {
      return {
        state: "success",
        challenge: loadedChallenge,
      };
    } else {
      return {
        state: "failed",
        reason: `${loadedChallenge.display} challenge failed: ${failReasons.join(", ")}`,
      };
    }
  } catch (e) {
    console.error(e);
    return {
      state: "error",
      errorMessage: "Something went wrong when verifying challenge",
      error: e,
    };
  }
}

function verifyRequirement(
  result: CompletedEvent,
  requirements: NonNullable<ChallengeSettings["requirements"]>,
  requirementType: keyof NonNullable<ChallengeSettings["requirements"]>,
): [boolean, string[]] {
  let failReasons: string[] = [];

  if (requirements[requirementType] === undefined) {
    throw new Error("Requirement value is undefined");
  }

  if (requirementType === "wpm" && requirements.wpm) {
    const requirementValue = requirements.wpm;
    if ("exact" in requirementValue) {
      if (Math.round(result.wpm) !== requirementValue.exact) {
        failReasons.push(`WPM not ${requirementValue.exact}`);
      }
    } else if ("min" in requirementValue) {
      if (result.wpm < requirementValue.min) {
        failReasons.push(`WPM below ${requirementValue.min}`);
      }
    }
  } else if (requirementType === "acc" && requirements.acc) {
    const requirementValue = requirements.acc;
    if ("exact" in requirementValue) {
      if (result.acc !== requirementValue.exact) {
        failReasons.push(`Accuracy not ${requirementValue.exact}`);
      }
    } else if ("min" in requirementValue) {
      if (result.acc < requirementValue.min) {
        failReasons.push(`Accuracy below ${requirementValue.min}`);
      }
    }
  } else if (requirementType === "afk" && requirements.afk) {
    const requirementValue = requirements.afk;
    const afk = (result.afkDuration / result.testDuration) * 100;
    if (requirementValue.max) {
      if (Math.round(afk) > requirementValue.max) {
        failReasons.push(`AFK percentage above ${requirementValue.max}`);
      }
    }
  } else if (requirementType === "time" && requirements.time) {
    const requirementValue = requirements.time;
    if ("min" in requirementValue) {
      if (Math.round(result.testDuration) < requirementValue.min) {
        failReasons.push(`Test time below ${requirementValue.min}`);
      }
    } else if ("max" in requirementValue) {
      if (Math.round(result.testDuration) > requirementValue.max) {
        failReasons.push(`Test time above ${requirementValue.max}`);
      }
    }
  } else if (requirementType === "funbox" && requirements.funbox) {
    const funboxMode = requirements.funbox.exact;
    if (funboxMode === undefined) {
      throw new Error("Funbox mode is undefined");
    }

    if (!areUnsortedArraysEqual(funboxMode, result.funbox)) {
      for (const f of funboxMode) {
        if (!result.funbox?.includes(f)) {
          failReasons.push(`${f} funbox not active`);
        }
      }
      if (result.funbox !== undefined && result.funbox.length > 0) {
        for (const f of result.funbox) {
          if (!funboxMode.includes(f)) {
            failReasons.push(`${f} funbox active`);
          }
        }
      }
    }
  } else if (requirementType === "raw" && requirements.raw) {
    const requirementValue = requirements.raw;
    if (requirementValue.exact) {
      if (Math.round(result.rawWpm) !== requirementValue.exact) {
        failReasons.push(`Raw WPM not ${requirementValue.exact}`);
      }
    }
  } else if (requirementType === "con" && requirements.con) {
    const requirementValue = requirements.con;
    if (requirementValue.exact) {
      if (Math.round(result.consistency) !== requirementValue.exact) {
        failReasons.push(`Consistency not ${requirementValue.exact}`);
      }
    }
  }

  return [failReasons.length === 0, failReasons];
}
