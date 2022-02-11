let testActive = false;

export function get() {
  return testActive;
}

export function set(active) {
  testActive = active;
}
