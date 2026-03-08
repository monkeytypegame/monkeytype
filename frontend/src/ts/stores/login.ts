import { createSignal } from "solid-js";

const [loading, setLoading] = createSignal(false);
const [inputsDisabled, setInputsDisabled] = createSignal(false);
const [signUpButtonEnabled, setSignUpButtonEnabled] = createSignal(false);
const [serverDisabled, setServerDisabled] = createSignal(false);

export const getLoading = loading;
export const getInputsDisabled = inputsDisabled;
export const getSignUpButtonEnabled = signUpButtonEnabled;
export const getServerDisabled = serverDisabled;

export function showPreloader(): void {
  setLoading(true);
}

export function hidePreloader(): void {
  setLoading(false);
}

export function enableInputs(): void {
  setInputsDisabled(false);
}

export function disableInputs(): void {
  setInputsDisabled(true);
}

export function enableSignUpButton(): void {
  setSignUpButtonEnabled(true);
}

export function disableSignUpButton(): void {
  setSignUpButtonEnabled(false);
}

export function setLoginDisabledByServer(): void {
  setServerDisabled(true);
}

export function resetForm(): void {
  setLoading(false);
  setInputsDisabled(false);
  setSignUpButtonEnabled(false);
}
