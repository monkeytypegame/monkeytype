let testActive = false;

export function get(): boolean {
  return testActive;
}

export function set(active: boolean): void {
  testActive = active;
}
