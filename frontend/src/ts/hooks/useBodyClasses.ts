import { Accessor, createEffect, onCleanup } from "solid-js";

/**
 * Keeps the enabled `classes` on `<body>` (`classList` style: name → on):
 * added on every change, removed on the next change and on cleanup. `<body>`
 * is outside the render root, so it can't be bound in JSX. Classes must not
 * be shared between callers: the first cleanup would remove them for both.
 *
 * @example
 * ```ts
 * useBodyClasses(() => ({ darkMode: isDark() }));
 * ```
 */
export function useBodyClasses(
  classes: Accessor<Record<string, boolean>>,
): void {
  createEffect(() => {
    const current = Object.entries(classes())
      .filter(([, enabled]) => enabled)
      .map(([name]) => name);
    document.body.classList.add(...current);
    onCleanup(() => document.body.classList.remove(...current));
  });
}
