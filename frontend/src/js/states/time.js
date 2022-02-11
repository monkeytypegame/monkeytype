let time = 0;

export function get() {
  return time;
}

export function set(active) {
  time = active;
}

export function increment() {
  time++;
}
