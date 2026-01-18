import { createSignal } from "solid-js";

type LoaderSignal = null | {
  visible: boolean;
  instant?: boolean;
};

const [getLoaderBarSignal, set] = createSignal<LoaderSignal>(null);

export function showLoaderBar(instant = false): void {
  const current = getLoaderBarSignal();
  // Don't update if already showing (unless instant flag changed)
  if (current?.visible && current.instant === instant) {
    return;
  }
  set({ visible: true, instant });
}

export function hideLoaderBar(): void {
  const current = getLoaderBarSignal();
  // Don't update if already hidden
  if (current?.visible === false) {
    return;
  }
  set({ visible: false });
}

export { getLoaderBarSignal };
