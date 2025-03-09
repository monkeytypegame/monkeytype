import * as fs from "fs";
import { createRequire } from "module";
import * as path from "path";

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
  solid: parseIcons("solid"),
  regular: parseIcons("regular"),
  brands: parseIcons("brands"),
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

/**
 * Detect used fontawesome icons in the directories `src/**` and `static/**{.html|.css}`
 * @param {boolean} debug - Enable debug output
 * @returns {FontawesomeConfig} - used icons
 */

export function getFontawesomeConfig(debug = false): FontawesomeConfig {
  const time = Date.now();
  const srcFiles = findAllFiles(
    "./src",
    (filename) =>
      !filename.endsWith("fontawesome-5.scss") &&
      !filename.endsWith("fontawesome-6.scss") //ignore our own css
  );
  const staticFiles = findAllFiles(
    "./static",
    (filename) => filename.endsWith(".html") || filename.endsWith(".css")
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
        usedClassesSet.add((icon as string).substring(3));
      });
    }
  }

  const usedClasses = new Array(...usedClassesSet).sort();
  const allModuleClasses = Object.values(modules2).flatMap((it) => it);
  const icons = usedClasses.filter((it) => !allModuleClasses.includes(it));

  const solid = icons.filter((it) => iconSet.solid.includes(it));
  const regular = icons.filter((it) => iconSet.regular.includes(it));
  const brands = usedClasses.filter((it) => iconSet.brands.includes(it));

  const leftOvers = icons.filter(
    (it) => !(solid.includes(it) || regular.includes(it) || brands.includes(it))
  );
  if (leftOvers.length !== 0) {
    throw new Error("unknown icons: " + leftOvers);
  }

  if (debug) {
    console.debug(
      "Make sure fontawesome modules are active: ",
      Object.entries(modules2)
        .filter((it) => usedClasses.filter((c) => it[1].includes(c)).length > 0)
        .map((it) => it[0])
        .filter((it) => it !== "brands")
        .join(", ")
    );

    console.debug(
      "Here is your config: \n",
      JSON.stringify({
        regular,
        solid,
        brands,
      })
    );
    console.debug("Detected fontawesome classes in", Date.now() - time, "ms");
  }

  return {
    regular,
    solid,
    brands,
  };
}

//detect if we run this as a main
if (import.meta.url.endsWith(process.argv[1] as string)) {
  getFontawesomeConfig(true);
}

function toFileAndDir(dir: string, file: string): FileObject {
  const name = path.join(dir, file);
  return { name, isDirectory: fs.statSync(name).isDirectory() };
}

function findAllFiles(
  dir: string,
  filter: (filename: string) => boolean = (_it): boolean => true
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

function parseIcons(iconSet: string): string[] {
  const require = createRequire(import.meta.url);
  const path = require.resolve(
    `@fortawesome/fontawesome-free/js/${iconSet}.js`
  );
  const file: string | null = fs.readFileSync(path).toString();

  return file
    ?.match(/"(.*)": \[.*\],/g)
    ?.map((it) => it.substring(1, it.indexOf(":") - 1)) as string[];
}
