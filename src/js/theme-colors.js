// export let bg = "#323437";
// export let main = "#e2b714";
// export let caret = "#e2b714";
// export let sub = "#646669";
// export let text = "#d1d0c5";
// export let error = "#ca4754";
// export let errorExtra = "#7e2a33";
// export let colorfulError = "#ca4754";
// export let colorfulErrorExtra = "#7e2a33";

let colors = {
  bg: "#323437",
  main: "#e2b714",
  caret: "#e2b714",
  sub: "#646669",
  text: "#d1d0c5",
  error: "#ca4754",
  errorExtra: "#7e2a33",
  colorfulError: "#ca4754",
  colorfulErrorExtra: "#7e2a33",
};

export async function get(color) {
  let ret;

  if (color === undefined) {
    ret = colors;
  } else {
    ret = colors[color];
  }

  return ret;

  // return check();

  // async function run() {
  //   return new Promise(function (resolve, reject) {
  //     window.setTimeout(() => {
  //       update();
  //       if (color === undefined) {
  //         ret = colors;
  //       } else {
  //         ret = colors[color];
  //       }
  //       resolve(check());
  //     }, 250);
  //   });
  // }
  // async function check() {
  //   if (color === undefined) {
  //     if (ret.bg === "") {
  //       return await run();
  //     } else {
  //       return ret;
  //     }
  //   } else {
  //     if (ret === "") {
  //       return await run();
  //     } else {
  //       return ret;
  //     }
  //   }
  // }
}

export function reset() {
  colors = {
    bg: "",
    main: "",
    caret: "",
    sub: "",
    text: "",
    error: "",
    errorExtra: "",
    colorfulError: "",
    colorfulErrorExtra: "",
  };
}

export function update() {
  let st = getComputedStyle(document.body);
  colors.bg = st.getPropertyValue("--bg-color").replace(" ", "");
  colors.main = st.getPropertyValue("--main-color").replace(" ", "");
  colors.caret = st.getPropertyValue("--caret-color").replace(" ", "");
  colors.sub = st.getPropertyValue("--sub-color").replace(" ", "");
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
