import { lazyQsr } from "../utils/dom";

const elem = lazyQsr(".pageTest #testInitFailed");
const testElem = lazyQsr(".pageTest #typingTest");
const errorElem = lazyQsr(".pageTest #testInitFailed .error");

export function show(): void {
  elem().show();
  testElem().hide();
}

function hideError(): void {
  errorElem().hide();
}

export function showError(text: string): void {
  errorElem().show().setText(text);
}

export function hide(): void {
  hideError();
  elem().hide();
  testElem().show();
}
