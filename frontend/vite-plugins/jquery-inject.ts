import { Plugin } from "vite";
import MagicString from "magic-string";

export function jqueryInject(): Plugin {
  return {
    name: "simple-jquery-inject",
    async transform(src: string, id: string) {
      if (id.endsWith(".ts")) {
        //check if file has a jQuery or $() call
        if (/(?:jQuery|\$)\([^)]*\)/.test(src)) {
          const s = new MagicString(src);

          //if file has "use strict"; at the top, add it below that line, if not, add it at the very top
          if (src.startsWith(`"use strict";`)) {
            s.appendRight(12, `\nimport $ from "jquery";`);
          } else {
            s.prepend(`import $ from "jquery";`);
          }

          return {
            code: s.toString(),
            map: s.generateMap({ hires: true, source: id }),
          };
        }
      }
      return;
    },
  };
}
