export let leftState = false;
export let rightState = false;

$(document).on("keydown", (e) => {
  if (e.code === "AltLeft") {
    leftState = true;
  } else if (e.code === "AltRight") {
    rightState = true;
  }
});

$(document).on("keyup", (e) => {
  if (e.code === "AltLeft") {
    leftState = false;
  } else if (e.code === "AltRight") {
    rightState = false;
  }
});

export function reset(): void {
  leftState = false;
  rightState = false;
}
