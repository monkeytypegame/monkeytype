const compositionDisplay = document.getElementById(
  "compositionDisplay",
) as HTMLElement;

export function update(data: string): void {
  compositionDisplay.innerText = data;
}

export function hide(): void {
  compositionDisplay.classList.add("hidden");
}

export function show(): void {
  compositionDisplay.classList.remove("hidden");
}
