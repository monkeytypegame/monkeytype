// Challenge links (?challenge=<name>), a url action (../action.ts)

import { getChallenges } from "@monkeytype/challenges";
import { ChallengeName } from "@monkeytype/schemas/challenges";

import { z } from "zod";

import * as ChallengeController from "../../controllers/challenge-controller";
import { restart as restartTest } from "../../test/test-logic";
import { defineSearchAction } from "../action";

export const challengeAction = defineSearchAction({
  in: "search",
  param: "challenge",
  encoding: "plain",
  failure: "Failed to load challenge",
  // the challenge's name, any case
  schema: z.string().transform((value, ctx) => {
    const name = challengeNameLookup[value.toLowerCase()];
    if (name === undefined) {
      ctx.addIssue({ code: "custom", message: `unknown challenge ${value}` });
      return z.NEVER;
    }
    return name;
  }),
  apply: applyChallenge,
});

const challengeNameLookup: Record<string, ChallengeName> = Object.fromEntries(
  getChallenges().map((it) => [it.name.toLowerCase(), it.name]),
);

async function applyChallenge(name: ChallengeName): Promise<void> {
  if (await ChallengeController.setup(name)) {
    await restartTest({
      nosave: true,
    });
  }
}
