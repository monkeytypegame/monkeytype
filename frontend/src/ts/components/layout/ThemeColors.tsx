import { createEffect, JSXElement } from "solid-js";
import { getThemeColors } from "../../signals/theme";
import { useRefWithUtils } from "../../hooks/useRefWithUtils";

export function ThemeColors(): JSXElement {
  // Refs are assigned by SolidJS via the ref attribute
  const [styleRef, styleEl] = useRefWithUtils<HTMLStyleElement>();

  createEffect(() => {
    styleEl()?.setHtml(`
:root {

    --bg-color: ${getThemeColors().bg};
    --main-color: ${getThemeColors().main};
    --caret-color: ${getThemeColors().caret};
    --sub-color: ${getThemeColors().sub};
    --sub-alt-color: ${getThemeColors().subAlt};
    --text-color: ${getThemeColors().text};
    --error-color: ${getThemeColors().error};
    --error-extra-color:${getThemeColors().errorExtra};
    --colorful-error-color: ${getThemeColors().colorfulError};
    --colorful-error-extra-color: ${getThemeColors().colorfulErrorExtra};
}
        `);
  });

  return <style ref={styleRef} />;
}
