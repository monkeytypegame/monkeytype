import { capitalizeFirstLetter } from "../../utils/strings";

export function show(): void {
  $("#typingTest #layoutfluidTimer").stop(true, true).animate(
    {
      opacity: 1,
    },
    125
  );
}

export function hide(): void {
  $("#typingTest #layoutfluidTimer").stop(true, true).animate(
    {
      opacity: 0,
    },
    125
  );
}

export function updateTime(sec: number, layout: string): void {
  $("#typingTest #layoutfluidTimer").text(
    `${capitalizeFirstLetter(layout)} in: ${sec}s`
  );
}

export function updateWords(words: number, layout: string): void {
  const layoutName = capitalizeFirstLetter(layout.replace(/_/g, " "));
  let str = `${layoutName} in: ${words} words`;
  if (words === 1) {
    str = `${layoutName} starting next word`;
  }
  $("#typingTest #layoutfluidTimer").text(str);
}
