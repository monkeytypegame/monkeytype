import { createSignalWithSetters } from "../hooks/createSignalWithSetters";

export const [
  getLoginPageInputsEnabled,
  { enableLoginPageInputs, disableLoginPageInputs },
] = createSignalWithSetters(true)({
  enableLoginPageInputs: (set) => set(true),
  disableLoginPageInputs: (set) => set(false),
});
