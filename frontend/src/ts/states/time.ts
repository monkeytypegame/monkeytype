let time = 0;

export function get(): number {
  return time;
}

export function set(number: number): void {
  time = number;
}

export function increment(): void {
  time++;
}
