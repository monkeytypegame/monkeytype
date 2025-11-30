let autoJoin: string | undefined = undefined;

export function setAutoJoin(code: string): void {
  autoJoin = code;
}

export function getAutoJoin(): string | undefined {
  return autoJoin;
}

export function clearAutoJoin(): void {
  autoJoin = undefined;
}
