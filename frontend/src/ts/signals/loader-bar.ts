import { createSignal } from "solid-js";

type LoaderSignal = null | {
  visible: boolean;
  instant?: boolean;
};

const [getLoaderBarSignal, set] = createSignal<LoaderSignal>(null);

export function showLoaderBar(instant = false): void {
  set({ visible: true, instant });
}

export function hideLoaderBar(): void {
  set({ visible: false });
}

export { getLoaderBarSignal };
