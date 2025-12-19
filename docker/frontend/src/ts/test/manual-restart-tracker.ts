let state = false;

export function set(): void {
  state = true;
}

export function reset(): void {
  state = false;
}

export function get(): boolean {
  return state;
}
