let transition = true;

export function set(val) {
  transition = val;
}

export function get() {
  return transition;
}
