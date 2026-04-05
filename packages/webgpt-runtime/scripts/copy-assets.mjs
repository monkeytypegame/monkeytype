import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDirectory, "..");
const sourceDirectory = path.join(packageRoot, "src", "assets");
const targetDirectory = path.join(packageRoot, "dist", "assets");

await fs.rm(targetDirectory, {
  recursive: true,
  force: true,
});
await fs.mkdir(path.dirname(targetDirectory), {
  recursive: true,
});
await fs.cp(sourceDirectory, targetDirectory, {
  recursive: true,
});
