let activePage: MonkeyTypes.Page | undefined = "loading";

export function get(): MonkeyTypes.Page | undefined {
  return activePage;
}

export function set(active: MonkeyTypes.Page | undefined): void {
  activePage = active;
}
