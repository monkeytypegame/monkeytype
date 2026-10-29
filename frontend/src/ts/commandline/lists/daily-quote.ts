import { navigate } from "../../router/navigate";
import * as DailyQuote from "../../test/daily-quote";
import * as TestLogic from "../../test/test-logic";
import { Command } from "../types";

const commands: Command[] = [
  {
    id: "loadDailyQuote",
    display: "Daily quote",
    fa: { icon: "fa-calendar-day" },
    alias: "wordle",
    exec: async (): Promise<void> => {
      await navigate({ to: "/" });
      if (await DailyQuote.setupDailyQuote()) await TestLogic.restartTest();
    },
  },
  {
    id: "exitDailyQuote",
    display: "Exit daily quote",
    fa: { icon: "fa-calendar-day" },
    exec: (): void => {
      DailyQuote.exitDailyQuote();
      void TestLogic.restartTest();
    },
    available: () => DailyQuote.isDailyActive(),
  },
  {
    id: "copyDailyQuoteResult",
    display: "Copy daily quote result",
    fa: { icon: "fa-share-alt" },
    exec: (): void => void DailyQuote.copyShareText(),
    available: () => DailyQuote.getDailyResult() !== null,
  },
];

export default commands;
