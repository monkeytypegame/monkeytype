let slowTimer = false;

export function set(): void {
  if (slowTimer) return;
  slowTimer = true;
  console.error("Slow timer, disabling animations");
  // Notifications.add("Slow timer detected", -1, 5);
}

export function clear(): void {
  slowTimer = false;
}

export function get(): boolean {
  return slowTimer;
}
