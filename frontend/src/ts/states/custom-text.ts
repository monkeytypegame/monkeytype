let customTestName = ""; // It should be empty when the text is not saved or a saved text has been modified

export function getCustomTextName(): string {
  return customTestName;
}

export function setCustomTextName(newName: string): void {
  customTestName = newName;
}

setInterval(() => console.log(customTestName), 5000); // TODO: Rizwan Mustafa: Remove this line
