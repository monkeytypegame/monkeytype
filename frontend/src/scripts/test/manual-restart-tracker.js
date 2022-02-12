let state = false;

export function set() {
  state = true;
}

export function reset() {
  state = false;
}

export function get() {
  return state;
}
