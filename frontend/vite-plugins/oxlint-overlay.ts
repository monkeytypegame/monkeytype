// Oxlint overlay client-side code
let overlay: HTMLDivElement | null = null;

function createOverlay(): HTMLDivElement {
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = "oxlint-error-overlay";
  overlay.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: #323437;
    color: #e4dec8ff;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: 'Roboto Mono', monospace;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    display: none;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: opacity 0.2s ease;
  `;

  overlay.addEventListener("mouseenter", () => {
    if (overlay) overlay.style.opacity = "0.5";
  });

  overlay.addEventListener("mouseleave", () => {
    if (overlay) overlay.style.opacity = "1";
  });

  overlay.addEventListener("click", () => {
    if (overlay) overlay.style.display = "none";
  });

  document.body.appendChild(overlay);
  return overlay;
}

function updateOverlay(data: {
  errorCount?: number;
  warningCount?: number;
  running?: boolean;
  hadIssues?: boolean;
  typeAware?: boolean;
}): void {
  const overlayEl = createOverlay();

  // Show running icon if linting is running and there were issues before
  if (data.running) {
    if (data.hadIssues || data.typeAware) {
      const message = data.typeAware ? "checking type aware..." : "checking...";
      overlayEl.innerHTML = `
        <span style="font-size: 18px;">⏳</span>
        <span>oxlint: ${message}</span>
      `;
      overlayEl.style.display = "flex";
      overlayEl.style.color = "#e4dec8ff";
    } else {
      overlayEl.style.display = "none";
    }
    return;
  }

  const { errorCount = 0, warningCount = 0, hadIssues = false } = data;
  const total = errorCount + warningCount;

  if (total > 0) {
    overlayEl.innerHTML = `
      <span style="font-size: 18px;">🚨</span>
      <span>oxlint: ${errorCount} error${errorCount !== 1 ? "s" : ""}, ${warningCount} warning${warningCount !== 1 ? "s" : ""}</span>
    `;
    overlayEl.style.display = "flex";

    if (errorCount > 0) {
      overlayEl.style.color = "#e4dec8ff";
    }
  } else {
    // Only show success if the previous lint had issues
    if (hadIssues) {
      overlayEl.innerHTML = `
        <span style="font-size: 18px;">✅</span>
        <span>oxlint: ok</span>
      `;
      overlayEl.style.display = "flex";
      overlayEl.style.color = "#e4dec8ff";

      // Hide after 3 seconds
      setTimeout(() => {
        overlayEl.style.display = "none";
      }, 3000);
    } else {
      // Two good lints in a row - don't show anything
      overlayEl.style.display = "none";
    }
  }
}

// Initialize overlay on load
createOverlay();

if (import.meta.hot) {
  import.meta.hot.on(
    "vite-plugin-oxlint",
    (data: {
      errorCount?: number;
      warningCount?: number;
      running?: boolean;
      hadIssues?: boolean;
    }) => {
      updateOverlay(data);
    },
  );
}
