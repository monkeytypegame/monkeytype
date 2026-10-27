import { getFunbox } from "@monkeytype/funbox";
import { Link, MetaProvider } from "@solidjs/meta";
import { createMemo, For, JSXElement, Show } from "solid-js";

import { getConfig } from "../../config/store";
import { useBodyClasses } from "../../hooks/useBodyClasses";
import { getIsScreenshotting } from "../../states/core";
import { getAppliedFunboxes } from "../../states/test";

/**
 * Funbox document state: body classes and stylesheets for the applied funboxes
 * (test page only), and the crt mode, which stays on across pages.
 */
export function Funbox(): JSXElement {
  const applied = createMemo(() => getFunbox(getAppliedFunboxes()));
  const isCrt = (): boolean =>
    getConfig.funbox.includes("crt") && !getIsScreenshotting();

  useBodyClasses(() => ({
    ...Object.fromEntries(
      applied().map((fb) => [`fb-${fb.name.replaceAll("_", "-")}`, true]),
    ),
    "ignore-reduced-motion": applied().some((fb) =>
      fb.properties?.includes("ignoreReducedMotion"),
    ),
    crtmode: isCrt(),
  }));

  return (
    <MetaProvider>
      <For
        each={applied().filter((fb) => fb.properties?.includes("hasCssFile"))}
      >
        {(fb) => (
          <Link
            rel="stylesheet"
            class="funBoxTheme"
            href={`funbox/${fb.name}.css`}
          />
        )}
      </For>
      <Show when={isCrt()}>
        <Link rel="stylesheet" id="globalFunBoxTheme" href="funbox/crt.css" />
        <div id="scanline"></div>
      </Show>
    </MetaProvider>
  );
}
