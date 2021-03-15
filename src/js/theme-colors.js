export let bg = "#323437";
export let main = "#e2b714";
export let caret = "#e2b714";
export let sub = "#646669";
export let text = "#d1d0c5";
export let error = "#ca4754";
export let errorExtra = "#7e2a33";
export let colorfulError = "#ca4754";
export let colorfulErrorExtra = "#7e2a33";

export function update() {
  let st = getComputedStyle(document.body);

  bg = st.getPropertyValue("--bg-color").replace(" ", "");
  main = st.getPropertyValue("--main-color").replace(" ", "");
  caret = st.getPropertyValue("--caret-color").replace(" ", "");
  sub = st.getPropertyValue("--sub-color").replace(" ", "");
  text = st.getPropertyValue("--text-color").replace(" ", "");
  error = st.getPropertyValue("--error-color").replace(" ", "");
  errorExtra = st.getPropertyValue("--error-extra-color").replace(" ", "");
  colorfulError = st
    .getPropertyValue("--colorful-error-color")
    .replace(" ", "");
  colorfulErrorExtra = st
    .getPropertyValue("--colorful-error-extra-color")
    .replace(" ", "");
}
