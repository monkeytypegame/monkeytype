let customTestName = "";

export function getCustomTextName(): string {
  return customTestName;
}

export function setCustomTextName(newName: string): void {
  customTestName = newName;
}

setInterval(() => console.log(customTestName), 5000); // TODO: Rizwan Mustafa: Remove this line
