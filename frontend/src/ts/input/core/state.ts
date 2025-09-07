let correctShiftUsed = true;
let incorrectShiftsInARow = 0;
let awaitingNextWord = false;
let lastBailoutAttempt = -1;
let lastInsertCompositionTextData = "";
let lastCompositionUpdateSameAsInput = false;

export function isCorrectShiftUsed(): boolean {
  return correctShiftUsed;
}

export function setCorrectShiftUsed(value: boolean): void {
  correctShiftUsed = value;
}

export function getIncorrectShiftsInARow(): number {
  return incorrectShiftsInARow;
}

export function setIncorrectShiftsInARow(value: number): void {
  incorrectShiftsInARow = value;
}

export function incrementIncorrectShiftsInARow(): void {
  incorrectShiftsInARow++;
}

export function resetIncorrectShiftsInARow(): void {
  incorrectShiftsInARow = 0;
}

export function isAwaitingNextWord(): boolean {
  return awaitingNextWord;
}

export function setAwaitingNextWord(value: boolean): void {
  awaitingNextWord = value;
}

export function getLastBailoutAttempt(): number {
  return lastBailoutAttempt;
}

export function setLastBailoutAttempt(value: number): void {
  lastBailoutAttempt = value;
}

export function getLastInsertCompositionTextData(): string {
  return lastInsertCompositionTextData;
}

export function setLastInsertCompositionTextData(value: string): void {
  lastInsertCompositionTextData = value;
}

export function getLastCompositionUpdateSameAsInput(): boolean {
  return lastCompositionUpdateSameAsInput;
}

export function setLastCompositionUpdateSameAsInput(value: boolean): void {
  lastCompositionUpdateSameAsInput = value;
}
