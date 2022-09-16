import * as TestLogic from "../../test/test-logic";
import * as TestUI from "../../test/test-ui";

const copyWords: MonkeyTypes.CommandsSubgroup = {
  title: "Are you sure...",
  list: [
    {
      id: "copyNo",
      display: "Nevermind",
    },
    {
      id: "copyYes",
      display: "Yes, I am sure",
      exec: (): void => {
        const words = Misc.getWords();

        navigator.clipboard.writeText(words).then(
          () => {
            Notifications.add("Copied to clipboard", 1);
          },
          () => {
            Notifications.add("Failed to copy!", -1);
          }
        );
      },
    },
  ],
};

const commands: MonkeyTypes.Command[] = [
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
    display: "Save screenshot",
    icon: "fa-image",
    alias: "ss picture",
    exec: (): void => {
      setTimeout(() => {
        TestUI.screenshot();
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
    subgroup: copyWords,
  },
];
export default commands;
