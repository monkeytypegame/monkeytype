import { createSignal } from "solid-js";

type LoaderSignal = null | {
  action: "show" | "hide";
  instant?: boolean;
};

const [getLoaderBarSignal, set] = createSignal<LoaderSignal>(null);

export function showLoaderBar(instant = false): void {
  set({ action: "show", instant });
}

export function hideLoaderBar(): void {
  set({ action: "hide" });
}

export { getLoaderBarSignal };
