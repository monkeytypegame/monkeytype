import * as TestStats from "./test-stats";
import * as Notifications from "./notification-center";
import Config from "./config";
import * as CustomText from "./custom-text";

//TODO remove after adding them to modules
let setMode;
let restartTest;

export let before = {
  mode: null,
  punctuation: null,
  numbers: null,
};

export function init(setMode, restartTest) {
  if (this.setMode === undefined) this.setMode = setMode;
  if (this.restartTest === undefined) this.restartTest = restartTest;

  if (Object.keys(TestStats.missedWords).length == 0) {
    Notifications.add("You haven't missed any words.", 0);
    return;
  }
  let mode = before.mode === null ? Config.mode : before.mode;
  let punctuation =
    before.punctuation === null ? Config.punctuation : before.punctuation;
  let numbers = before.numbers === null ? Config.numbers : before.numbers;
  setMode("custom");
  let newCustomText = [];
  Object.keys(TestStats.missedWords).forEach((missedWord) => {
    for (let i = 0; i < TestStats.missedWords[missedWord]; i++) {
      newCustomText.push(missedWord);
    }
  });
  CustomText.setText(newCustomText);
  CustomText.setIsWordRandom(true);
  CustomText.setWord(50);

  restartTest();
  before.mode = mode;
  before.punctuation = punctuation;
  before.numbers = numbers;
}

export function resetBefore() {
  before.mode = null;
  before.punctuation = null;
  before.numbers = null;
}
