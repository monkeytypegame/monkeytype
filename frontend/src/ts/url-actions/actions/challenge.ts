// Challenge links (?challenge=<name>), a url action (../action.ts)

import { getChallenges } from "@monkeytype/challenges";
import { ChallengeName } from "@monkeytype/schemas/challenges";

import * as ChallengeController from "../../controllers/challenge-controller";
import { restart as restartTest } from "../../test/test-logic";
import { UrlSearchAction } from "../action";

export const challengeAction: UrlSearchAction = {
  in: "search",
  param: "challenge",
  failure: "Failed to load challenge",
  apply: async (value) => applyChallenge(decodeChallenge(value)),
};

const challengeNameLookup = Object.fromEntries(
  getChallenges().map((it) => [it.name.toLowerCase(), it.name]),
);

/** The challenge named `value`, any case. Throws for an unknown name. */
export function decodeChallenge(value: string): ChallengeName {
  const name = challengeNameLookup[value.toLowerCase()];
  if (name === undefined) {
    throw new Error(`invalid name ${value.toLowerCase()}`);
  }
  return name;
}

async function applyChallenge(name: ChallengeName): Promise<void> {
  if (await ChallengeController.setup(name)) {
    await restartTest({
      nosave: true,
    });
  }
}
