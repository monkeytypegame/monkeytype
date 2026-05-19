const ligatureInputOverrides = new Map<string, string>([
  ["œ", "oe"],
  ["Œ", "OE"],
  ["æ", "ae"],
  ["Æ", "AE"],
]);

let pendingLigatureCompletion: {
  completion: string;
  inputLength: number;
} | null = null;

type PendingLigatureCompletionStatus = "complete" | "skipped" | null;

export function getMatchingLigatureOverride(
  data: string,
  targetChar: string | undefined,
): string | null {
  if (targetChar === undefined) return null;

  const override = ligatureInputOverrides.get(targetChar);
  if (override?.[0] !== data) return null;

  return targetChar;
}

export function getLigatureCompletion(
  targetChar: string | undefined,
): string | null {
  if (targetChar === undefined) return null;

  const override = ligatureInputOverrides.get(targetChar);
  return override?.slice(1) ?? null;
}

export function setPendingLigatureCompletion(
  completion: string,
  inputLength: number,
): void {
  pendingLigatureCompletion = { completion, inputLength };
}

export function resetPendingLigatureCompletion(): void {
  pendingLigatureCompletion = null;
}

export function getPendingLigatureCompletionStatus(
  data: string,
  currentInput: string,
): PendingLigatureCompletionStatus {
  if (pendingLigatureCompletion === null) return null;

  if (currentInput.length !== pendingLigatureCompletion.inputLength) {
    resetPendingLigatureCompletion();
    return null;
  }

  const completionMatched = data === pendingLigatureCompletion.completion;
  resetPendingLigatureCompletion();

  return completionMatched ? "complete" : "skipped";
}
