// Daily quote links (?daily), a url action (../action.ts)

import { z } from "zod";

import { setupDailyQuote } from "../../test/daily-quote";
import { restartTest } from "../../test/test-logic";
import { defineSearchAction } from "../action";

export const dailyQuoteAction = defineSearchAction({
  in: "search",
  param: "daily",
  encoding: "plain",
  failure: "Failed to load the daily quote",
  // the value is ignored
  schema: z.string(),
  apply: async () => {
    if (await setupDailyQuote()) await restartTest();
  },
});
