let activePage = "loading";

export function get(): string {
  return activePage;
}

export function set(active: string): void {
  activePage = active;
}
