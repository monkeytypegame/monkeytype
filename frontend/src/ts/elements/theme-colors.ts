let colors = {
  bg: "#323437",
  main: "#e2b714",
  caret: "#e2b714",
  sub: "#646669",
  subAlt: "#2c2e31",
  text: "#d1d0c5",
  error: "#ca4754",
  errorExtra: "#7e2a33",
  colorfulError: "#ca4754",
  colorfulErrorExtra: "#7e2a33",
};

type ColorName = keyof typeof colors;

export async function get(color: ColorName): Promise<string> {
  if (!colors[color]) update();
  return colors[color];
}

export async function getAll(): Promise<typeof colors> {
  if (!colors.bg) update();
  return colors;
}

export function reset(): void {
  colors = {
    bg: "",
    main: "",
    caret: "",
    sub: "",
    subAlt: "",
    text: "",
    error: "",
    errorExtra: "",
    colorfulError: "",
    colorfulErrorExtra: "",
  };
}

export function update(): void {
  const st = getComputedStyle(document.body);
  colors.bg = st.getPropertyValue("--bg-color").replace(" ", "");
  colors.main = st.getPropertyValue("--main-color").replace(" ", "");
  colors.caret = st.getPropertyValue("--caret-color").replace(" ", "");
  colors.sub = st.getPropertyValue("--sub-color").replace(" ", "");
  colors.subAlt = st.getPropertyValue("--sub-alt-color").replace(" ", "");
  colors.text = st.getPropertyValue("--text-color").replace(" ", "");
  colors.error = st.getPropertyValue("--error-color").replace(" ", "");
  colors.errorExtra = st
    .getPropertyValue("--error-extra-color")
    .replace(" ", "");
  colors.colorfulError = st
    .getPropertyValue("--colorful-error-color")
    .replace(" ", "");
  colors.colorfulErrorExtra = st
    .getPropertyValue("--colorful-error-extra-color")
    .replace(" ", "");
}
