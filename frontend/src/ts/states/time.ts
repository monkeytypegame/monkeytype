import { setTestTime } from "../signals/test";

let time = 0;

export function get(): number {
  return time;
}

export function set(number: number): void {
  time = number;
  setTestTime(time);
}

export function increment(): void {
  time++;
  setTestTime(time);
}
