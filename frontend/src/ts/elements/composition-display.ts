import Config from "../config";

const compositionDisplay = document.getElementById(
  "compositionDisplay",
) as HTMLElement;

const languagesToShow = ["korean", "japanese", "chinese"];

export function shouldShow(): boolean {
  return languagesToShow.some((lang) => Config.language.startsWith(lang));
}

export function update(data: string): void {
  compositionDisplay.innerText = data;
}

export function hide(): void {
  compositionDisplay.classList.add("hidden");
}

export function show(): void {
  compositionDisplay.classList.remove("hidden");
}
