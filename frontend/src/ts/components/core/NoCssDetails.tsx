import { For, JSXElement, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { envConfig } from "virtual:env-config";

const keyStyle = {
  padding: "1rem",
  display: "inline-block",
  "border-radius": "1rem",
  background: "#2c2e31",
};

/**
 * Fills the static no-CSS warning (warnings.html) with the reload shortcut for
 * this platform and the requested stylesheets and scripts. Inline styles only:
 * it shows when the CSS failed to load.
 */
export function NoCssDetails(): JSXElement {
  const isMac = window.navigator.userAgent.toLowerCase().includes("mac");
  const stylesheets = (
    [...document.querySelectorAll("link[rel=stylesheet]")] as HTMLLinkElement[]
  )
    .map((l) => l.href)
    .filter((l) => /\/css\/style/gi.test(l));
  const scripts = (
    [...document.querySelectorAll("script")] as HTMLScriptElement[]
  )
    .map((l) => l.src)
    .filter((l) => /(\/js\/mon|\/js\/vendor)/gi.test(l));

  return (
    <>
      <Mount at={document.getElementById("nocss-keys")}>
        <span
          style={{
            ...keyStyle,
            "margin-top": isMac ? "1rem" : undefined,
            "margin-bottom": "1rem",
          }}
        >
          {isMac ? "Cmd" : "Ctrl"}
        </span>{" "}
        + <span style={keyStyle}>Shift</span> + <span style={keyStyle}>R</span>
      </Mount>
      <Mount at={document.getElementById("nocss-stylesheets")}>
        Requested stylesheets:
        <For each={stylesheets}>
          {(href) => (
            <>
              <br />
              {href}
            </>
          )}
        </For>
      </Mount>
      <Mount at={document.getElementById("nocss-js")}>
        Requested Javascript files:
        <For each={scripts}>
          {(src) => (
            <>
              <br />
              {src}
            </>
          )}
        </For>
        <br />
        <br />
        Client version:
        <br />
        {envConfig.clientVersion}
      </Mount>
    </>
  );
}

/** Renders into an empty mount point of the static warning markup. */
function Mount(props: {
  at: HTMLElement | null;
  children: JSXElement;
}): JSXElement {
  return (
    <Show when={props.at}>
      {(el) => (
        <Portal
          mount={el()}
          // the wrapper div Portal adds must not break the inline text
          ref={(wrapper) => (wrapper.style.display = "contents")}
        >
          {props.children}
        </Portal>
      )}
    </Show>
  );
}
