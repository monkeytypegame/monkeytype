import { createSignalWithSetters } from "../hooks/createSignalWithSetters";

export const [
  getLoginPageInputsEnabled,
  { enableLoginPageInputs, disableLoginPageInputs },
] = createSignalWithSetters(true)({
  enableLoginPageInputs: (set) => set(true),
  disableLoginPageInputs: (set) => set(false),
});

export const [
  getLoginPageLoader,
  { showLoginPageLoader, hideLoginPageLoader },
] = createSignalWithSetters(false)({
  showLoginPageLoader: (set) => set(true),
  hideLoginPageLoader: (set) => set(false),
});

export function resetForm(): void {
  hideLoginPageLoader();
  enableLoginPageInputs();
}
