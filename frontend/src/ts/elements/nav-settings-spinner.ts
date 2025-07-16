const el = document.querySelector(
  "header .view-settings .icon i"
) as HTMLElement;

export function hide(): void {
  el.classList.remove("fa-spin");
}

export function show(): void {
  el.classList.add("fa-spin");
}
