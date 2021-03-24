import * as TestLogic from "./test-logic";
import * as Notifications from "./notification-center";

export let active = "none";
let memoryTimer = null;
let memoryInterval = null;

export function reset() {
  active = "none";
  resetMemoryTimer();
}

export function startMemoryTimer() {
  resetMemoryTimer();
  memoryTimer = Math.round(Math.pow(TestLogic.words.length, 1.2));
  updateMemoryTimer(memoryTimer);
  showMemoryTimer();
  memoryInterval = setInterval(() => {
    memoryTimer -= 1;
    memoryTimer == 0 ? hideMemoryTimer() : updateMemoryTimer(memoryTimer);
    if (memoryTimer <= 0) {
      resetMemoryTimer();
      $("#wordsWrapper").addClass("hidden");
    }
  }, 1000);
}

export function resetMemoryTimer() {
  memoryInterval = clearInterval(memoryInterval);
  memoryTimer = null;
  hideMemoryTimer();
}

export function setActive(val) {
  active = val;
}

function showMemoryTimer() {
  $("#typingTest #memoryTimer").stop(true, true).animate(
    {
      opacity: 1,
    },
    125
  );
}

function hideMemoryTimer() {
  $("#typingTest #memoryTimer").stop(true, true).animate(
    {
      opacity: 0,
    },
    125
  );
}

function updateMemoryTimer(sec) {
  $("#typingTest #memoryTimer").text(
    `Timer left to memorise all words: ${sec}s`
  );
}

export function toggleScript(...params) {
  if (active === "tts") {
    var msg = new SpeechSynthesisUtterance();
    msg.text = params[0];
    msg.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);
  }
}
