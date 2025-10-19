<script lang="ts">
  import { calculateWPM } from "../ts/stats";

  export let totalCharsTyped = 0;
  export let realErrors = 0;
  export let minorSwapErrors = 0;
  export let minutes = 1;

  const { rawWPM, potentialWPM } = calculateWPM(
    totalCharsTyped,
    realErrors,
    minutes
  );

  const roundedRaw = Math.round(rawWPM);
  const roundedPotential = Math.round(potentialWPM);
  const tooltipLabel = `Potential WPM: ${roundedPotential} (ignoring ${minorSwapErrors} swap error${minorSwapErrors === 1 ? "" : "s"})`;
</script>

<div class="wpm-container">
  <span class="main-wpm" aria-label={`Raw WPM: ${roundedRaw}`}>{roundedRaw}</span>
  <button
    class="potential-wpm-btn"
    type="button"
    aria-label={tooltipLabel}
    title={tooltipLabel}
  >
    ⚡
  </button>
</div>

<style>
  .wpm-container {
    position: relative;
    display: inline-flex;
    align-items: flex-end;
    padding-right: 1.5rem;
  }

  .main-wpm {
    font-size: 2rem;
    font-weight: 700;
    line-height: 1;
  }

  .potential-wpm-btn {
    position: absolute;
    bottom: 0;
  right: 0;
    padding: 0.1rem 0.35rem;
    font-size: 0.75rem;
    line-height: 1;
    border: 1px solid var(--border-color, #ccc);
    border-radius: 4px;
    background: var(--background-muted, #f5f5f5);
    color: inherit;
    cursor: pointer;
    transition: background 0.15s ease-in-out, border-color 0.15s ease-in-out;
  }

  .potential-wpm-btn:hover,
  .potential-wpm-btn:focus-visible {
    background: var(--background-hover, #eee);
    border-color: var(--border-color-hover, #aaa);
    outline: none;
  }

  .potential-wpm-btn:focus-visible {
    box-shadow: 0 0 0 2px rgba(100, 150, 250, 0.4);
  }
</style>
