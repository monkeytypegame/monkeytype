import { testPageRef } from "./test-page";

const elem = testPageRef(".pageTest #testInitFailed");
const testElem = testPageRef(".pageTest #typingTest");
const errorElem = testPageRef(".pageTest #testInitFailed .error");

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
