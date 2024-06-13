import * as UpdateConfig from "../../config";
import * as TestLogic from "../../test/test-logic";
import { isAuthenticated } from "../../firebase";

const commands: MonkeyTypes.Command[] = [
  {
    id: "changeQuoteLength",
    display: "Quote length...",
    icon: "fa-quote-right",
    alias: "quotes",
    subgroup: {
      title: "Change quote length...",
      configKey: "quoteLength",
      list: [
        {
          id: "changeQuoteLengthAll",
          display: "all",
          configValue: [0, 1, 2, 3],
          exec: (): void => {
            UpdateConfig.setMode("quote");
            UpdateConfig.setQuoteLength([0, 1, 2, 3]);
            TestLogic.restart();
          },
        },
        {
          id: "changeQuoteLengthShort",
          display: "short",
          configValue: 0,
          configValueMode: "include",
          exec: (): void => {
            UpdateConfig.setMode("quote");
            UpdateConfig.setQuoteLength(0);
            TestLogic.restart();
          },
        },
        {
          id: "changeQuoteLengthMedium",
          display: "medium",
          configValue: 1,
          configValueMode: "include",
          exec: (): void => {
            UpdateConfig.setMode("quote");
            UpdateConfig.setQuoteLength(1);
            TestLogic.restart();
          },
        },
        {
          id: "changeQuoteLengthLong",
          display: "long",
          configValue: 2,
          configValueMode: "include",
          exec: (): void => {
            UpdateConfig.setMode("quote");
            UpdateConfig.setQuoteLength(2);
            TestLogic.restart();
          },
        },
        {
          id: "changeQuoteLengthThicc",
          display: "thicc",
          configValue: 3,
          configValueMode: "include",
          exec: (): void => {
            UpdateConfig.setMode("quote");
            UpdateConfig.setQuoteLength(3);
            TestLogic.restart();
          },
        },
        {
          id: "changeQuoteLengthFavorite",
          display: "favorite",
          configValue: -3,
          configValueMode: "include",
          available: (): boolean => {
            return isAuthenticated();
          },
          exec: (): void => {
            UpdateConfig.setMode("quote");
            UpdateConfig.setQuoteLength(-3);
            TestLogic.restart();
          },
        },
      ],
    },
  },
];

export default commands;
