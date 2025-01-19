import * as TestLogic from "../../test/test-logic";
import * as TestUI from "../../test/test-ui";
import * as PractiseWordsModal from "../../modals/practise-words";
import * as Notifications from "../../elements/notifications";
import * as TestInput from "../../test/test-input";
import * as TestWords from "../../test/test-words";
import Config from "../../config";
import * as PractiseWords from "../../test/practise-words";
import { Command, CommandsSubgroup } from "../types";

const practiceSubgroup: CommandsSubgroup = {
  title: "Practice words...",
  list: [
    {
      id: "practiseWordsMissed",
      display: "missed",
      exec: (): void => {
        PractiseWords.init("words", false);
        TestLogic.restart({
          practiseMissed: true,
        });
      },
    },
    {
      id: "practiseWordsSlow",
      display: "slow",
      exec: (): void => {
        PractiseWords.init("off", true);
        TestLogic.restart({
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
      return TestUI.resultVisible;
    },
    exec: (): void => {
      TestLogic.restart();
    },
  },
  {
    id: "repeatTest",
    display: "Repeat test",
    icon: "fa-sync-alt",
    exec: (): void => {
      TestLogic.restart({
        withSameWordset: true,
      });
    },
    available: (): boolean => {
      return TestUI.resultVisible;
    },
  },
  {
    id: "practiseWords",
    display: "Practice words...",
    icon: "fa-exclamation-triangle",
    subgroup: practiceSubgroup,
    available: (): boolean => {
      return TestUI.resultVisible;
    },
  },
  {
    id: "toggleWordHistory",
    display: "Toggle word history",
    icon: "fa-align-left",
    exec: (): void => {
      TestUI.toggleResultWords();
    },
    available: (): boolean => {
      return TestUI.resultVisible;
    },
  },
  {
    id: "saveScreenshot",
    display: "Copy screenshot to clipboard",
    icon: "fa-image",
    alias: "save",
    exec: (): void => {
      setTimeout(() => {
        void TestUI.screenshot();
      }, 500);
    },
    available: (): boolean => {
      return TestUI.resultVisible;
    },
  },
  {
    id: "copyWordsToClipboard",
    display: "Copy words to clipboard",
    icon: "fa-copy",
    exec: (): void => {
      const words = (
        Config.mode === "zen"
          ? TestInput.input.history
          : TestWords.words.list.slice(0, TestInput.input.history.length)
      ).join(" ");

      navigator.clipboard.writeText(words).then(
        () => {
          Notifications.add("Copied to clipboard", 1);
        },
        () => {
          Notifications.add("Failed to copy!", -1);
        }
      );
    },
    available: (): boolean => {
      return TestUI.resultVisible;
    },
  },
];
export default commands;
