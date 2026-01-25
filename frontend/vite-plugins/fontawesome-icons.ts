import { Plugin } from "vite";
import { getFontawesomeConfig } from "./fontawesome-subset";

const virtualModuleId = "virtual:fa-icons";
const resolvedVirtualModuleId = "\0" + virtualModuleId;

export function fontawesomeIcons(options: { isDevelopment: boolean }): Plugin {
  return {
    name: "virtual-fontawesome-icons",
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId;
      return;
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        if (options.isDevelopment) {
          //make all icons available on dev
          return `
          import '@fortawesome/fontawesome-free/js/all.js';
          export function initIcons(){};
          `;
        } else {
          //only include icons we actually use on prod
          return generateFontAwesomeCode();
        }
      }
      return;
    },
  };
}

export function generateFontAwesomeCode(): string {
  const source = getFontawesomeConfig();
  const importStatements = [];

  // Regular icons
  const regularImports = source.regular.map(
    (icon) => `fa${toCamelCase(icon)} as faRegular${toCamelCase(icon)}`,
  );
  importStatements.push(
    `import { ${regularImports.join(", ")} } from "@fortawesome/free-regular-svg-icons";`,
  );

  // Solid icons
  const solidImports = source.solid.map(
    (icon) => `fa${toCamelCase(icon)} as faSolid${toCamelCase(icon)}`,
  );
  importStatements.push(
    `import { ${solidImports.join(", ")} } from "@fortawesome/free-solid-svg-icons";`,
  );

  // Brands icons
  const brandImports = source.brands.map(
    (icon) => `fa${toCamelCase(icon)} as faBrands${toCamelCase(icon)}`,
  );
  importStatements.push(
    `import { ${brandImports.join(", ")} } from "@fortawesome/free-brands-svg-icons";`,
  );

  // Common imports
  importStatements.push(
    `import { dom, library } from "@fortawesome/fontawesome-svg-core";`,
  );

  const code = [];
  code.push("export function initIcons(){");

  code.push(
    `  library.add(${source.solid.map((icon) => `faSolid${toCamelCase(icon)}`).join(", ")});`,
  );

  code.push(
    `  library.add(${source.regular.map((icon) => `faRegular${toCamelCase(icon)}`).join(", ")});`,
  );

  code.push(
    `  library.add(${source.brands.map((icon) => `faBrands${toCamelCase(icon)}`).join(", ")});`,
  );

  code.push("  dom.watch();");

  code.push("}");

  return [...importStatements, "", ...code].join("\n");
}
function toCamelCase(str: string): string {
  const cc = str.replace(/-./g, (match) => match.charAt(1).toUpperCase());
  return cc.charAt(0).toUpperCase() + cc.slice(1);
}

//detect if we run this as a main
if (import.meta.url.endsWith(process.argv[1] as string)) {
  console.log(generateFontAwesomeCode());
}
