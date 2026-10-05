import { Plugin } from "vite";
import { createRequire } from "node:module";
import path from "node:path";
import { createReadStream, readdirSync, readFileSync } from "node:fs";
import type { VendorAssets } from "virtual:vendor-assets";

const virtualModuleId = "virtual:vendor-assets";
const resolvedVirtualModuleId = `\0${virtualModuleId}`;

const mimeTypes: Record<string, string> = {
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".wasm": "application/wasm",
};

type Package = { dir: string; baseUrl: string };

function resolvePackage(name: string, from: NodeJS.Require): Package {
  const packageJson = from.resolve(`${name}/package.json`);
  const { version } = JSON.parse(readFileSync(packageJson, "utf8")) as {
    version: string;
  };
  return {
    dir: path.dirname(packageJson),
    //the version makes the url immutable, so it can be cached forever
    baseUrl: `/vendor/${name.replace("@", "").replace("/", "-")}@${version}`,
  };
}

/**
 * Serves runtime files of third party libraries from our own origin.
 *
 * Some libraries load extra files (web workers, wasm, data files) by url at
 * runtime and by default fetch them from a public CDN. This plugin copies
 * those files from `node_modules` into `dist/vendor` (and serves them from the
 * dev server), so that nothing is requested from a third party.
 *
 * The urls are exposed to the app in the `virtual:vendor-assets` module.
 */
export function vendorAssets(): Plugin {
  const require = createRequire(path.join(process.cwd(), "package.json"));

  const pdfjs = resolvePackage("pdfjs-dist", require);
  const tesseract = resolvePackage("tesseract.js", require);
  const tesseractCore = resolvePackage(
    "tesseract.js-core",
    //not a direct dependency, use the version tesseract.js depends on
    createRequire(path.join(tesseract.dir, "package.json")),
  );
  const tesseractEng = resolvePackage("@tesseract.js-data/eng", require);

  /** url => absolute path */
  const files = new Map<string, string>();

  const addFile = (pkg: Package, file: string): string => {
    const url = `${pkg.baseUrl}/${file}`;
    files.set(url, path.join(pkg.dir, file));
    return url;
  };

  const addDirectory = (
    pkg: Package,
    directory: string,
    include?: RegExp,
  ): string => {
    for (const file of readdirSync(path.join(pkg.dir, directory))) {
      if (include === undefined || include.test(file)) {
        addFile(pkg, directory === "" ? file : `${directory}/${file}`);
      }
    }
    return directory === "" ? pkg.baseUrl : `${pkg.baseUrl}/${directory}`;
  };

  addFile(pdfjs, "LICENSE");
  addFile(tesseract, "LICENSE.md");
  addFile(tesseractCore, "LICENSE");

  const assets: VendorAssets = {
    pdfWorkerSrc: addFile(pdfjs, "legacy/build/pdf.worker.min.mjs"),
    pdfCMapUrl: `${addDirectory(pdfjs, "cmaps")}/`,
    pdfStandardFontDataUrl: `${addDirectory(pdfjs, "standard_fonts")}/`,
    ocrWorkerPath: addFile(tesseract, "dist/worker.min.js"),
    //tesseract.js picks one of the lstm builds depending on simd support
    ocrCorePath: addDirectory(
      tesseractCore,
      "",
      /^tesseract-core(-relaxedsimd|-simd)?-lstm\.wasm\.js$/,
    ),
    ocrLangPath: addDirectory(
      tesseractEng,
      "4.0.0_best_int",
      /\.traineddata\.gz$/,
    ),
  };

  return {
    name: "vendor-assets",
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId;
      return;
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return `export const vendorAssets = ${JSON.stringify(assets)};`;
      }
      return;
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url ?? "").split("?")[0] ?? "");
        const file = files.get(url);
        if (file === undefined) {
          next();
          return;
        }
        res.setHeader(
          "Content-Type",
          mimeTypes[path.extname(file)] ?? "application/octet-stream",
        );
        createReadStream(file).pipe(res);
      });
    },
    generateBundle() {
      for (const [url, file] of files) {
        this.emitFile({
          type: "asset",
          fileName: url.slice(1),
          source: readFileSync(file),
        });
      }
    },
  };
}
