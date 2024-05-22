import * as fs from "fs";
import * as path from "path";

function toFileAndDir(dir, file) {
  const name = path.join(dir, file);
  return { name, isDirectory: fs.statSync(name).isDirectory() };
}

export function getFontawesomeClasses(debug = false) {
  const getAllFiles = (dir, filter = (filename) => true) =>
    fs
      .readdirSync(dir)
      .map((it) => toFileAndDir(dir, it))
      .filter((file) => file.isDirectory || filter(file.name))
      .reduce((files, file) => {
        return file.isDirectory
          ? [...files, ...getAllFiles(file.name, filter)]
          : [...files, file.name];
      }, []);

  const srcFiles = getAllFiles(
    "./src",
    (filename) => !filename.endsWith("fontawesome.scss")
  );
  const staticFiles = getAllFiles(
    "./static",
    (filename) => filename.endsWith(".html") || filename.endsWith(".css")
  );
  const allFiles = [...srcFiles, ...staticFiles];

  const result = new Set();

  const regex = new RegExp("[^a-zA-Z0-9-_]", "g");
  for (const file of allFiles) {
    fs.readFileSync("./" + file)
      .toString()
      .split(regex)
      .filter((it) => it.includes("fa-"))
      .forEach((it) => result.add(it));
  }

  const allClasses = new Array(...result);

  const brandsModule = {
    name: "brands",
    classes: [
      "fa-github",
      "fa-twitter",
      "fa-discord",
      "fa-patreon",
      "fa-google",
    ],
  };

  const modules = [
    { name: "fixed-width", classes: ["fa-fw"] },
    {
      name: "rotated-flipped",
      classes: ["fa-rotate-90", "fa-rotate-180", "fa-rotate-270"],
    },
    { name: "animated", classes: ["fa-spin"] },
    brandsModule,
  ];

  const solid = allClasses
    .filter(
      (it) =>
        it.length > 3 &&
        modules.filter((mod) => mod.classes.includes(it)).length === 0
    )
    .map((it) => it.substring(3))
    .sort();

  const brands = allClasses
    .filter((it) => it.length > 3 && brandsModule.classes.includes(it))
    .map((it) => it.substring(3));

  if (debug === true) {
    console.debug(
      "Make sure fontawesome modules are active: ",
      modules
        .filter(
          (it) => allClasses.filter((c) => it.classes.includes(c)).length > 0
        )
        .map((it) => it.name)
        .filter((it) => it !== "brands")

        .join(", ")
    );

    console.debug(
      "Here is your config: \n",
      JSON.stringify({
        solid,
        brands,
      })
    );
  }

  return {
    solid,
    brands,
  };
}

if (import.meta.url.endsWith(process.argv[1])) {
  getFontawesomeClasses(true);
}
