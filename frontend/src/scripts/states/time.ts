let time = 0;

export function get(): number {
  return time;
}

export function set(active: number): void {
  time = active;
}

export function increment(): void {
  time++;
}
