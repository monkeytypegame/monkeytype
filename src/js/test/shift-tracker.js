export let leftState = false;
export let rightState = false;

$(document).keydown((e) => {
  if (e.code === "ShiftLeft") {
    leftState = true;
    rightState = false;
  } else if (e.code === "ShiftRight") {
    leftState = false;
    rightState = true;
  }
});

$(document).keyup((e) => {
  if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
    leftState = false;
    rightState = false;
  }
});

export function reset() {
  leftState = false;
  rightState = false;
}

let leftSideChars = [
  "Q",
  "W",
  "E",
  "R",
  "T",

  "A",
  "S",
  "D",
  "F",
  "G",

  "Z",
  "X",
  "C",
  "V",

  "`",
  "1",
  "2",
  "3",
  "4",
  "5",
];

let rightSideChars = [
  "U",
  "I",
  "O",
  "P",

  "H",
  "J",
  "K",
  "L",

  "N",
  "M",

  "7",
  "8",
  "9",
  "0",

  "\\",
  "[",
  "]",
  ";",
  "'",
  ",",
  ".",
  "/",
];

export function isUsingOppositeShift(char) {
  if (!leftState && !rightState) return null;
  if (!rightSideChars.includes(char) && !leftSideChars.includes(char))
    return null;

  if (
    (leftState && rightSideChars.includes(char)) ||
    (rightState && leftSideChars.includes(char))
  ) {
    return true;
  } else {
    return false;
  }
}
