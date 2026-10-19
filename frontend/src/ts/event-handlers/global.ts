import { showErrorNotification } from "../states/notifications";
import { isDevEnvironment } from "../utils/env";

//stop space scrolling
window.addEventListener("keydown", function (e) {
  if (
    e.code === "Space" &&
    (e.target === document.body || (e.target as HTMLElement)?.id === "result")
  ) {
    e.preventDefault();
  }
});

window.onerror = function (message, url, line, column, error): void {
  if (isDevEnvironment()) {
    showErrorNotification(error?.message ?? "Undefined message", {
      customTitle: "DEV: Unhandled error",
      durationMs: 5000,
      important: true,
    });
    console.error({ message, url, line, column, error });
  }
};

window.onunhandledrejection = function (e): void {
  if (isDevEnvironment()) {
    showErrorNotification(
      (e.reason as Error).message ?? e.reason ?? "Undefined message",
      {
        customTitle: "DEV: Unhandled rejection",
        durationMs: 5000,
        important: true,
      },
    );
  }
};
