import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = path.resolve(import.meta.dirname, "..");

// --- Argument handling ---

const args = process.argv.slice(2);
const maxDepthFlagIdx = args.indexOf("--depth");
let maxDepthLimit = Infinity;
if (maxDepthFlagIdx !== -1) {
  maxDepthLimit = Number(args[maxDepthFlagIdx + 1]);
  args.splice(maxDepthFlagIdx, 2);
}

const target = args[0];
if (target === undefined || target === "") {
  console.log("Usage: pnpm import-tree <file-or-directory> [--depth <n>]");
  process.exit(1);
}

const resolved = path.resolve(target);

function collectTsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTsFiles(full));
    } else if (/\.tsx?$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

const isDir = fs.statSync(resolved).isDirectory();
const boundary = isDir ? resolved : null;

let entryPoints: string[];
if (isDir) {
  entryPoints = collectTsFiles(resolved);
} else {
  entryPoints = [resolved];
}

if (entryPoints.length === 0) {
  console.log("No .ts/.tsx files found.");
  process.exit(1);
}

// --- Import extraction (type-aware) ---

const tsConfig: ts.CompilerOptions = {
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ESNext,
  jsx: ts.JsxEmit.Preserve,
  sourceMap: false,
  declaration: false,
  isolatedModules: true,
};

const JS_IMPORT_RE =
  /(?:import|export)\s+(?:(?:\{[^}]*\}|[\w*]+(?:\s*,\s*\{[^}]*\})?)\s+from\s+)?["']([^"']+)["']/g;

function extractImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8");
  let outputText: string;
  try {
    ({ outputText } = ts.transpileModule(content, {
      compilerOptions: tsConfig,
      fileName: filePath,
    }));
  } catch {
    // Some files (e.g. declaration files) can't be transpiled — fall back to
    // regex on the original source, which still strips type-only imports.
    outputText = content;
  }
  const specifiers: string[] = [];
  for (const match of outputText.matchAll(JS_IMPORT_RE)) {
    const spec = match[1];
    if (spec !== undefined) specifiers.push(spec);
  }
  return specifiers;
}

// --- Resolution ---

const EXTENSIONS = [".ts", ".tsx", "/index.ts", "/index.tsx"];

function resolveSpecifier(
  specifier: string,
  importerDir: string,
): string | null {
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const base = path.resolve(importerDir, specifier);
    // exact match
    if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
    for (const ext of EXTENSIONS) {
      const candidate = base + ext;
      if (fs.existsSync(candidate)) return candidate;
    }
    return null;
  }

  // @monkeytype packages are treated as leaf nodes (no recursion into them)
  if (specifier.startsWith("@monkeytype/")) return specifier;

  return null; // third-party / virtual
}

const printed = new Set<string>();

// --- Graph traversal ---

type NodeInfo = {
  directImports: string[];
  totalReachable: number;
  maxDepth: number;
};

const cache = new Map<string, NodeInfo>();

function walk(
  filePath: string,
  ancestors: Set<string>,
): { reachable: Set<string>; maxDepth: number } {
  const cached = cache.get(filePath);
  if (cached !== undefined) {
    return {
      reachable: new Set(getAllReachable(filePath, new Set())),
      maxDepth: cached.maxDepth,
    };
  }

  const importerDir = path.dirname(filePath);
  const specifiers = extractImports(filePath);
  const directImports: string[] = [];

  const reachable = new Set<string>();
  let maxDepth = 0;

  for (const spec of specifiers) {
    const resolved = resolveSpecifier(spec, importerDir);
    if (resolved === null) continue;
    if (directImports.includes(resolved)) continue;
    directImports.push(resolved);

    if (ancestors.has(resolved)) continue; // circular

    reachable.add(resolved);

    // @monkeytype packages are leaf nodes — don't recurse
    if (resolved.startsWith("@monkeytype/")) {
      maxDepth = Math.max(maxDepth, 1);
      continue;
    }

    ancestors.add(resolved);
    const sub = walk(resolved, ancestors);
    ancestors.delete(resolved);

    for (const r of sub.reachable) reachable.add(r);
    maxDepth = Math.max(maxDepth, 1 + sub.maxDepth);
  }

  if (directImports.length > 0 && maxDepth === 0) {
    maxDepth = 1;
  }

  cache.set(filePath, {
    directImports,
    totalReachable: reachable.size,
    maxDepth,
  });

  return { reachable, maxDepth };
}

function getAllReachable(filePath: string, visited: Set<string>): string[] {
  const info = cache.get(filePath);
  if (!info) return [];
  const result: string[] = [];
  for (const dep of info.directImports) {
    if (visited.has(dep)) continue;
    visited.add(dep);
    result.push(dep);
    result.push(...getAllReachable(dep, visited));
  }
  return result;
}

// --- Colors ---

const c = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  white: "\x1b[37m",
};

const DEPTH_COLORS = [c.cyan, c.green, c.yellow, c.blue, c.magenta, c.white];

function depthColor(depth: number): string {
  return DEPTH_COLORS[depth % DEPTH_COLORS.length] ?? c.cyan;
}

// --- Display ---

function leavesFolder(filePath: string): boolean {
  if (boundary === null) return false;
  if (filePath.startsWith("@monkeytype/")) return true;
  return !filePath.startsWith(boundary + "/");
}

function displayPath(filePath: string): string {
  if (filePath.startsWith(ROOT + "/")) {
    return path.relative(ROOT, filePath);
  }
  return filePath;
}

function printTree(
  filePath: string,
  ancestors: Set<string>,
  prefix: string,
  isLast: boolean,
  isRoot: boolean,
  depth: number = 0,
): void {
  const info = cache.get(filePath);
  const dp = displayPath(filePath);
  const connector = isRoot ? "" : isLast ? "└── " : "├── ";
  const dc = depthColor(depth);

  const leaves = !isRoot && leavesFolder(filePath);
  const leavesTag = leaves ? ` ${c.red}[↑]${c.reset}` : "";

  if (!info) {
    // leaf node (e.g. @monkeytype package)
    console.log(`${c.dim}${prefix}${connector}${dp}${c.reset}${leavesTag}`);
    return;
  }

  const stats =
    info.directImports.length > 0
      ? ` ${c.dim}(direct: ${info.directImports.length}, total: ${info.totalReachable}, depth: ${info.maxDepth})${c.reset}`
      : "";

  const nameStyle = isRoot ? c.bold + dc : dc;
  const seen = !isRoot && printed.has(filePath);
  const seenTag = seen ? ` ${c.dim}[seen above]${c.reset}` : "";
  console.log(
    `${c.dim}${prefix}${connector}${c.reset}${nameStyle}${dp}${c.reset}${stats}${leavesTag}${seenTag}`,
  );

  if (seen || depth >= maxDepthLimit) return;
  printed.add(filePath);

  const childPrefix = isRoot ? "" : prefix + (isLast ? "    " : "│   ");

  const deps = [...info.directImports];
  if (depth === 0) {
    deps.sort((a, b) => {
      const ta = cache.get(a)?.totalReachable ?? 0;
      const tb = cache.get(b)?.totalReachable ?? 0;
      return tb - ta;
    });
  }

  for (let i = 0; i < deps.length; i++) {
    const dep = deps[i];
    if (dep === undefined) continue;
    const last = i === deps.length - 1;

    if (ancestors.has(dep)) {
      const cc = last ? "└── " : "├── ";
      console.log(
        `${c.dim}${childPrefix}${cc}${c.reset}${c.red}[circular] ${displayPath(dep)}${c.reset}`,
      );
      continue;
    }

    ancestors.add(dep);
    printTree(dep, ancestors, childPrefix, last, false, depth + 1);
    ancestors.delete(dep);
  }
}

// --- Main ---

for (const entry of entryPoints) {
  if (!fs.existsSync(entry)) {
    console.log(`File not found: ${entry}`);
    continue;
  }
  walk(entry, new Set([entry]));
}

entryPoints.sort((a, b) => {
  const ta = cache.get(a)?.totalReachable ?? 0;
  const tb = cache.get(b)?.totalReachable ?? 0;
  return tb - ta;
});

for (const entry of entryPoints) {
  if (!cache.has(entry)) continue;
  printTree(entry, new Set([entry]), "", true, true);
  if (entryPoints.length > 1) console.log();
}

// --- Summary ---

let totalDirect = 0;
let totalTransitive = 0;
const uniqueDirect = new Set<string>();
const uniqueTransitive = new Set<string>();
let maxDirect = 0;
let maxDirectFile = "";
let maxTransitive = 0;
let maxTransitiveFile = "";
let maxDepthSeen = 0;
let maxDepthFile = "";

for (const entry of entryPoints) {
  const info = cache.get(entry);
  if (!info) continue;
  totalDirect += info.directImports.length;
  totalTransitive += info.totalReachable;
  for (const dep of info.directImports) {
    uniqueDirect.add(dep);
  }
  for (const dep of getAllReachable(entry, new Set())) {
    uniqueTransitive.add(dep);
  }
  if (info.directImports.length > maxDirect) {
    maxDirect = info.directImports.length;
    maxDirectFile = entry;
  }
  if (info.totalReachable > maxTransitive) {
    maxTransitive = info.totalReachable;
    maxTransitiveFile = entry;
  }
  if (info.maxDepth > maxDepthSeen) {
    maxDepthSeen = info.maxDepth;
    maxDepthFile = entry;
  }
}

console.log(`${c.dim}───────────────────────────${c.reset}`);
console.log(`Target:             ${c.bold}${displayPath(resolved)}${c.reset}`);
console.log(`Total direct:       ${c.bold}${totalDirect}${c.reset}`);
console.log(`Total transitive:   ${c.bold}${totalTransitive}${c.reset}`);
console.log(`Unique direct:      ${c.bold}${uniqueDirect.size}${c.reset}`);
console.log(`Unique transitive:  ${c.bold}${uniqueTransitive.size}${c.reset}`);
console.log(
  `Max direct:         ${c.bold}${maxDirect}${c.reset} ${c.dim}(${displayPath(maxDirectFile)})${c.reset}`,
);
console.log(
  `Max transitive:     ${c.bold}${maxTransitive}${c.reset} ${c.dim}(${displayPath(maxTransitiveFile)})${c.reset}`,
);
console.log(
  `Max depth:          ${c.bold}${maxDepthSeen}${c.reset} ${c.dim}(${displayPath(maxDepthFile)})${c.reset}`,
);

if (boundary !== null) {
  const externalDirect = new Set<string>();
  const externalTransitive = new Set<string>();
  for (const entry of entryPoints) {
    const info = cache.get(entry);
    if (!info) continue;
    for (const dep of info.directImports) {
      if (leavesFolder(dep)) externalDirect.add(dep);
    }
    for (const dep of getAllReachable(entry, new Set())) {
      if (leavesFolder(dep)) externalTransitive.add(dep);
    }
  }
  console.log(
    `Leaves folder ${c.red}[↑]${c.reset}: ${c.bold}${externalDirect.size}${c.reset} direct, ${c.bold}${externalTransitive.size}${c.reset} transitive`,
  );
}
