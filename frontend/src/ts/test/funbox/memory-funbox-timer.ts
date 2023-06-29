import * as TestWords from "../test-words";

let memoryTimer: number | null = null;
let memoryInterval: NodeJS.Timeout | null = null;

export function show(): void {
  $("#typingTest #memoryTimer").stop(true, true).animate(
    {
      opacity: 1,
    },
    125
  );
}

export function hide(): void {
  $("#typingTest #memoryTimer").stop(true, true).animate(
    {
      opacity: 0,
    },
    125
  );
}

export function reset(): void {
  if (memoryInterval !== null) {
    clearInterval(memoryInterval);
    memoryInterval = null;
  }
  memoryTimer = null;
  hide();
}

export function start(): void {
  reset();
  memoryTimer = Math.round(Math.pow(TestWords.words.length, 1.2));
  update(memoryTimer);
  show();
  memoryInterval = setInterval(() => {
    if (memoryTimer === null) return;
    memoryTimer -= 1;
    memoryTimer === 0 ? hide() : update(memoryTimer);
    if (memoryTimer <= 0) {
      reset();
      $("#wordsWrapper").addClass("hidden");
    }
  }, 1000);
}

export function update(sec: number): void {
  $("#typingTest #memoryTimer").text(
    `Timer left to memorise all words: ${sec}s`
  );
}
