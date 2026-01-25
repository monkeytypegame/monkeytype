import { fab } from "@fortawesome/free-brands-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import * as fs from "fs";
import * as path from "path";
import { Plugin } from "vite";

const virtualModuleId = "virtual:fa-icons";
const resolvedVirtualModuleId = "\0" + virtualModuleId;

type FontawesomeConfig = {
  /* used regular icons without `fa-` prefix*/
  regular: string[];
  /* used solid icons without `fa-` prefix*/
  solid: string[];
  /* used brands icons without `fa-` prefix*/
  brands: string[];
};

type FileObject = { name: string; isDirectory: boolean };

const iconSet = {
  solid: Object.keys(fas),
  regular: Object.keys(far),
  brands: Object.keys(fab),
};

/**
 * Map containing reserved classes by module
 */
const modules2 = {
  animated: ["spin", "pulse"],
  "bordererd-pulled": ["border", "pull-left", "pull-right"],
  "fixed-width": ["fw"],
  larger: [
    "lg",
    "xs",
    "sm",
    "1x",
    "2x",
    "3x",
    "4x",
    "5x",
    "6x",
    "7x",
    "8x",
    "9x",
    "10x",
  ],
  "rotated-flipped": [
    "rotate-90",
    "rotate-180",
    "rotate-270",
    "flip-horizontal",
    "flip-vertical",
    "flip-both",
  ],
  stacked: ["stack", "stack-1x", "stack-2x", "inverse"],
};

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
          import { library } from "@fortawesome/fontawesome-svg-core";
          import { fas } from "@fortawesome/free-solid-svg-icons";
          import { far } from "@fortawesome/free-regular-svg-icons";
          import { fab } from "@fortawesome/free-brands-svg-icons";
          export function initIcons(){
             library.add(fas, far, fab);
          };
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
  const regularImports = source.regular.map((icon) => `${icon} as far${icon}`);
  importStatements.push(
    `import { ${regularImports.join(", ")} } from "@fortawesome/free-regular-svg-icons";`,
  );

  // Solid icons
  const solidImports = source.solid.map((icon) => `${icon} as fas${icon}`);
  importStatements.push(
    `import { ${solidImports.join(", ")} } from "@fortawesome/free-solid-svg-icons";`,
  );

  // Brands icons
  const brandImports = source.brands.map((icon) => `${icon} as fab${icon}`);
  importStatements.push(
    `import { ${brandImports.join(", ")} } from "@fortawesome/free-brands-svg-icons";`,
  );

  // Common imports
  importStatements.push(
    `import { library } from "@fortawesome/fontawesome-svg-core";`,
  );

  const code = [];
  code.push("export function initIcons(){");

  code.push(
    `  library.add(${source.solid.map((icon) => `fas${icon}`).join(", ")});`,
  );

  code.push(
    `  library.add(${source.regular.map((icon) => `far${icon}`).join(", ")});`,
  );

  code.push(
    `  library.add(${source.brands.map((icon) => `fab${icon}`).join(", ")});`,
  );

  code.push("}");

  return [...importStatements, "", ...code].join("\n");
}
function toCamelCase(str: string): string {
  const cc = str.replace(/-./g, (match) => match.charAt(1).toUpperCase());
  return cc.charAt(0).toUpperCase() + cc.slice(1);
}

/**
 * Detect used fontawesome icons in the directories `src/**` and `static/**{.html|.css}`
 * @param {boolean} debug - Enable debug output
 * @returns {FontawesomeConfig} - used icons
 */
function getFontawesomeConfig(debug = false): FontawesomeConfig {
  const time = Date.now();
  const srcFiles = findAllFiles(
    "./src",
    (filename) =>
      !filename.endsWith("fontawesome-5.scss") &&
      !filename.endsWith("fontawesome-6.scss"), //ignore our own css
  );
  const staticFiles = findAllFiles(
    "./static",
    (filename) => filename.endsWith(".html") || filename.endsWith(".css"),
  );

  const allFiles = [...srcFiles, ...staticFiles];
  const usedClassesSet: Set<string> = new Set();

  const regex = /\bfa-[a-z0-9-]+\b/g;

  for (const file of allFiles) {
    const fileContent = fs.readFileSync("./" + file).toString();
    const matches = fileContent.match(regex);

    if (matches) {
      matches.forEach((match) => {
        const [icon] = match.split(" ");
        const name = "fa" + toCamelCase((icon as string).substring(3));
        usedClassesSet.add(name);
      });
    }
  }

  const usedClasses = [...usedClassesSet].sort();
  const allModuleClasses = new Set(
    Object.values(modules2).flatMap((it) =>
      it.map((name) => "fa" + toCamelCase(name)),
    ),
  );
  const icons = usedClasses.filter((it) => !allModuleClasses.has(it));

  const solid = icons.filter((it) => iconSet.solid.includes(it));
  const regular = icons.filter((it) => iconSet.regular.includes(it));
  const brands = usedClasses.filter((it) => iconSet.brands.includes(it));

  const leftOvers = icons.filter(
    (it) =>
      !(solid.includes(it) || regular.includes(it) || brands.includes(it)),
  );
  if (leftOvers.length !== 0) {
    throw new Error(
      "Fontawesome failed with unknown icons: " + leftOvers.toString(),
    );
  }

  if (debug) {
    console.debug(
      "Here is your config: \n",
      JSON.stringify({
        regular,
        solid,
        brands,
      }),
    );
    console.debug("Detected fontawesome classes in", Date.now() - time, "ms");
  }

  return {
    regular,
    solid,
    brands,
  };
}

function toFileAndDir(dir: string, file: string): FileObject {
  const name = path.join(dir, file);
  return { name, isDirectory: fs.statSync(name).isDirectory() };
}

function findAllFiles(
  dir: string,
  filter: (filename: string) => boolean = (_it): boolean => true,
): string[] {
  const files = fs
    .readdirSync(dir)
    .map((it) => toFileAndDir(dir, it))
    .filter((file) => file.isDirectory || filter(file.name));

  const out: string[] = [];
  for (const file of files) {
    if (file.isDirectory) {
      out.push(...findAllFiles(file.name, filter));
    } else {
      out.push(file.name);
    }
  }
  return out;
}

//detect if we run this as a main
if (import.meta.url.endsWith(process.argv[1] as string)) {
  console.log(generateFontAwesomeCode());
}
