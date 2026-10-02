const elem = document.querySelector<HTMLElement>(".pageTest #testInitFailed");
const testElem = document.querySelector<HTMLElement>(".pageTest #typingTest");
const errorElem = document.querySelector<HTMLElement>(
  ".pageTest #testInitFailed .error",
);

const messageElem = document.querySelector<HTMLElement>(
  ".pageTest #testInitFailed .message .text",
);
const defaultMessage = messageElem?.innerText ?? "";

export function show(message?: string): void {
  if (messageElem) messageElem.innerText = message ?? defaultMessage;
  if (message !== undefined) hideError();
  if (elem && testElem) {
    elem.classList.remove("hidden");
    testElem.classList.add("hidden");
  }
}

function hideError(): void {
  if (errorElem) {
    errorElem.classList.add("hidden");
  }
}

export function showError(text: string): void {
  if (errorElem) {
    errorElem.classList.remove("hidden");
    errorElem.innerText = text;
  }
}

export function hide(): void {
  if (elem && testElem) {
    hideError();
    elem.classList.add("hidden");
    testElem.classList.remove("hidden");
  }
}
