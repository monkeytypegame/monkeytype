import { createSignal } from "solid-js";

type LoaderSignal = null | {
  action: "show" | "hide";
  instant?: boolean;
};

const [getLoaderBarSignal, set] = createSignal<LoaderSignal>(null);

export function showLoaderBar(instant = false): void {
  const current = getLoaderBarSignal();
  // Don't update if already showing (unless instant flag changed)
  if (current?.action === "show" && current.instant === instant) {
    return;
  }
  set({ action: "show", instant });
}

export function hideLoaderBar(): void {
  const current = getLoaderBarSignal();
  // Don't update if already hidden
  if (current?.action === "hide") {
    return;
  }
  set({ action: "hide" });
}

export { getLoaderBarSignal };
