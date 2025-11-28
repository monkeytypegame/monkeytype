import { envConfig } from "virtual:env-config";
import { qs } from "../utils/dom";

qs("#nocss .requestedStylesheets")?.setStyle(
  "Requested stylesheets:<br>" +
    (
      [
        ...document.querySelectorAll("link[rel=stylesheet"),
      ] as HTMLAnchorElement[]
    )
      .map((l) => l.href)
      .filter((l) => /\/css\/style/gi.test(l))
      .join("<br>"),
);

qs("#nocss .requestedJs")?.setStyle(
  "Requested Javascript files:<br>" +
    ([...document.querySelectorAll("script")] as HTMLScriptElement[])
      .map((l) => l.src)
      .filter((l) => /(\/js\/mon|\/js\/vendor)/gi.test(l))
      .join("<br>") +
    "<br><br>Client version:<br>" +
    envConfig.clientVersion,
);

if (window.navigator.userAgent.toLowerCase().includes("mac")) {
  qs("#nocss .keys")?.setStyle(`
    <span
      style="
        padding: 1rem;
        display: inline-block;
        border-radius: 1rem;
        background: #2c2e31;
        margin-top: 1rem;
        margin-bottom: 1rem;
      "
    >
      Cmd
    </span>
    +
    <span
      style="
        padding: 1rem;
        display: inline-block;
        border-radius: 1rem;
        background: #2c2e31;
      "
    >
      Shift
    </span>
    +
    <span
      style="
        padding: 1rem;
        display: inline-block;
        border-radius: 1rem;
        background: #2c2e31;
      "
    >
      R
    </span>
  `);
} else {
  qs("#nocss .keys")?.setStyle(`
    <span
      style="
        padding: 1rem;
        display: inline-block;
        border-radius: 1rem;
        background: #2c2e31;
        margin-bottom: 1rem;
      "
    >
      Ctrl
    </span>
    +
    <span
      style="
        padding: 1rem;
        display: inline-block;
        border-radius: 1rem;
        background: #2c2e31;
      "
    >
      Shift
    </span>
    +
    <span
      style="
        padding: 1rem;
        display: inline-block;
        border-radius: 1rem;
        background: #2c2e31;
      "
    >
      R
    </span>
  `);
}
