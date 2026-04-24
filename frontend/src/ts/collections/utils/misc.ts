export function tempId(): string {
  return (
    "temp-" + Math.random().toString(36).slice(2) + Date.now().toString(36)
  );
}
