import * as TestLogic from "../../test/test-logic";
import * as TestUI from "../../test/test-ui";
import * as PractiseWordsModal from "../../modals/practise-words";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../states/notifications";
import { lastEventLog } from "../../test/test-state";
import * as TestWords from "../../test/test-words";
import { Config } from "../../config/store";
import * as PractiseWords from "../../test/practise-words";
import { Command, CommandsSubgroup } from "../types";
import * as TestScreenshot from "../../test/test-screenshot";
import { getInputHistory } from "../../test/events/stats";
import { getResultVisible } from "../../states/test";

const practiceSubgroup: CommandsSubgroup = {
  title: "Practice words...",
  list: [
    {
      id: "practiseWordsMissed",
      display: "missed",
      exec: (): void => {
        PractiseWords.init("words", false);
        void TestLogic.restart({
          practiseMissed: true,
        });
      },
    },
    {
      id: "practiseWordsSlow",
      display: "slow",
      exec: (): void => {
        PractiseWords.init("off", true);
        void TestLogic.restart({
          practiseMissed: true,
        });
      },
    },
    {
      id: "practiseWordsBoth",
      display: "both",
      exec: (): void => {
        PractiseWords.init("words", true);
        void TestLogic.restart({
          practiseMissed: true,
        });
      },
    },
    {
      id: "practiseWordsCustom",
      display: "custom...",
      opensModal: true,
      exec: (options): void => {
        PractiseWordsModal.show({
          animationMode: "modalOnly",
          modalChain: options.commandlineModal,
        });
      },
    },
  ],
};

const commands: Command[] = [
  {
    id: "nextTest",
    display: "Next test",
    alias: "restart start begin type test typing",
    icon: "fa-chevron-right",
    available: (): boolean => {
      return getResultVisible();
    },
    exec: (): void => {
      void TestLogic.restart();
    },
  },
  {
    id: "repeatTest",
    display: "Repeat test",
    icon: "fa-sync-alt",
    exec: (): void => {
      void TestLogic.restart({
        withSameWordset: true,
      });
    },
    available: (): boolean => {
      return getResultVisible();
    },
  },
  {
    id: "practiseWords",
    display: "Practice words...",
    icon: "fa-exclamation-triangle",
    subgroup: practiceSubgroup,
    available: (): boolean => {
      return getResultVisible();
    },
  },
  {
    id: "toggleWordHistory",
    display: "Toggle word history",
    icon: "fa-align-left",
    exec: (): void => {
      void TestUI.toggleResultWords();
    },
    available: (): boolean => {
      return getResultVisible();
    },
  },
  {
    id: "copyScreenshot",
    display: "Copy screenshot to clipboard",
    icon: "fa-copy",
    alias: "copy image clipboard",
    exec: (): void => {
      setTimeout(() => {
        void TestScreenshot.copyToClipboard();
      }, 500);
    },
    available: (): boolean => {
      return getResultVisible();
    },
  },
  {
    id: "downloadScreenshot",
    display: "Download screenshot",
    icon: "fa-download",
    alias: "save image download file",
    exec: (): void => {
      setTimeout(async () => {
        void TestScreenshot.download();
      }, 500);
    },
    available: (): boolean => {
      return getResultVisible();
    },
  },
  {
    id: "copyWordsToClipboard",
    display: "Copy words to clipboard",
    icon: "fa-copy",
    exec: (): void => {
      const eventLog = lastEventLog();
      if (eventLog === null) {
        showErrorNotification("No event log found!");
        return;
      }

      const inputHistory = getInputHistory(eventLog);
      const words =
        Config.mode === "zen"
          ? inputHistory.join("")
          : TestWords.words
              .get()
              .slice(0, inputHistory.length)
              .map((word) => word.textWithCommit)
              .join("");

      navigator.clipboard.writeText(words).then(
        () => {
          showSuccessNotification("Copied to clipboard");
        },
        () => {
          showErrorNotification("Failed to copy!");
        },
      );
    },
    available: (): boolean => {
      return getResultVisible();
    },
  },
];
export default commands;
