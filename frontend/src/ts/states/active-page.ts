let activePage: MonkeyTypes.PageName = "loading";

export function get(): MonkeyTypes.PageName {
  return activePage;
}

export function set(active: MonkeyTypes.PageName): void {
  activePage = active;
}
