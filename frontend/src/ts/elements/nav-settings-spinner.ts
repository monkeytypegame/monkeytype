const el = document.querySelector(
  "header .view-settings .spinner"
) as HTMLElement;

export function hide(): void {
  el.style.opacity = "0";
}

export function show(): void {
  el.style.opacity = "1";
}
