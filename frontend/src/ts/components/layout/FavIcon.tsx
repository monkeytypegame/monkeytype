import { createMemo, JSXElement } from "solid-js";
import { Theme } from "../../constants/themes";
import { isDevEnvironment } from "../../utils/misc";
import { Link } from "@solidjs/meta";

export function FavIcon(props: { theme: Theme }): JSXElement {
  const icon = createMemo<string>(() => {
    let { main, bg } = props.theme;
    if (isDevEnvironment()) {
      [main, bg] = [bg, main];
    }
    if (bg === main) {
      bg = "#111";
      main = "#eee";
    }

    const svgPre = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <style>
    #bg{fill:${bg};}
    path{fill:${main};}
  </style>
  <g>
    <path id="bg" d="M0 16Q0 0 16 0h32q16 0 16 16v32q0 16-16 16H16Q0 64 0 48"/>
    <path d="M9.09 24.1v21.2h5.12V33.1q.256-4.61 4.48-4.61 3.46.384 3.46 3.84v12.9h5.12v-11.5q-.128-5.25 4.48-5.25 3.46.384 3.46 3.84v12.9h5.12v-12.2q0-9.47-7.04-9.47-4.22 0-7.04 3.46-2.18-3.46-6.02-3.46-3.46 0-6.02 2.43v-2.05M47 18.9v5.12h-4.61v5.12H47v16.1h5.12v-16.1h4.61v-5.12h-4.61V18.9"/>
  </g>
</svg>
`;
    return "data:image/svg+xml;base64," + btoa(svgPre);
  });

  return (
    <Link id="favicon" rel="shortcut icon" type="image/svg+xml" href={icon()} />
  );
}
