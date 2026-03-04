import { createSignalWithSetters } from "../hooks/createSignalWithSetters";

type LoaderSignal = null | {
  visible: boolean;
  instant?: boolean;
};

export const [getLoaderBarSignal, { showLoaderBar, hideLoaderBar }] =
  createSignalWithSetters<LoaderSignal>(null)({
    showLoaderBar: (set, instant: boolean = false) =>
      set({ visible: true, instant }),
    hideLoaderBar: (set) => set({ visible: false }),
  });
