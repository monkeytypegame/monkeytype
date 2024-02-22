export function get(): boolean {
  return (localStorage.getItem("prefersArabicLazyMode") ?? "true") === "true";
}

export function set(value: boolean): void {
  localStorage.setItem("prefersArabicLazyMode", value ? "true" : "false");
}
