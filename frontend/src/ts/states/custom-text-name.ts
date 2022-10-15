let customTestName = ""; // It should be empty when the text is not saved or a saved text has been modified
let isLong: boolean | undefined = false;

export function getCustomTextName(): string {
  return customTestName;
}

export function isCustomTextLong(): boolean | undefined {
  return isLong;
}

export function setCustomTextName(
  newName: string,
  long: boolean | undefined
): void {
  customTestName = newName;
  isLong = long;
}
