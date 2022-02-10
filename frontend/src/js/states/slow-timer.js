let slowTimer = false;

export function set() {
  if (slowTimer) return;
  slowTimer = true;
  console.error("Slow timer, disabling animations");
  // Notifications.add("Slow timer detected", -1, 5);
}

export function clear() {
  slowTimer = false;
}

export function get() {
  return slowTimer;
}
