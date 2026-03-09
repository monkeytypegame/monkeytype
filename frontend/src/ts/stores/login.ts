import { createSignalWithSetters } from "../hooks/createSignalWithSetters";

export const [
  getLoginPageLoader,
  { showLoginPageLoader, hideLoginPageLoader },
] = createSignalWithSetters(false)({
  showLoginPageLoader: (set) => set(true),
  hideLoginPageLoader: (set) => set(false),
});
