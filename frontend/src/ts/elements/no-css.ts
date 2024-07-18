import { envConfig } from "../constants/env-config";

$("#nocss .requestedStylesheets").html(
  "Requested stylesheets:<br>" +
    (
      [
        ...document.querySelectorAll("link[rel=stylesheet"),
      ] as HTMLAnchorElement[]
    )
      .map((l) => l.href)
      .filter((l) => /\/css\/style/gi.test(l))
      .join("<br>")
);

$("#nocss .requestedJs").html(
  "Requested Javascript files:<br>" +
    ([...document.querySelectorAll("script")] as HTMLScriptElement[])
      .map((l) => l.src)
      .filter((l) => /(\/js\/mon|\/js\/vendor)/gi.test(l))
      .join("<br>") +
    "<br><br>Client version:<br>" +
    envConfig.clientVersion
);

if (window.navigator.userAgent.toLowerCase().includes("mac")) {
  $("#nocss .keys").html(`
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
  $("#nocss .keys").html(`
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
