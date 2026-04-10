/**
 * python-peg-grammar.ts — weighted generator for Python code snippets.
 *
 * Ported from Coding-Challenges/python-typing-tester/grammar.js.
 * Implements a pragmatic subset of the PEG grammar for Python
 * (function_def, if/elif/else, for, while, class_def, assignment,
 * augmented assignment, expressions, comparisons, calls,
 * comprehensions, import, return, lambda, etc).
 *
 * Choices in each non-terminal are weighted to favour common
 * constructs, so the generated text looks like plausible day-to-day
 * Python rather than uniformly-random grammar exploration.
 */

/* ---------- RNG + weighted pick ----------------------------- */

function randInt(n: number): number {
  return Math.floor(Math.random() * n);
}
function pick<T>(arr: readonly T[]): T {
  return arr[randInt(arr.length)] as T;
}
function coin(p: number): boolean {
  return Math.random() < p;
}

/* ---------- Global recursion depth guard -------------------- */
let RECURSION_DEPTH = 0;
const RECURSION_LIMIT = 8;
function enterRec(): void {
  RECURSION_DEPTH++;
}
function exitRec(): void {
  RECURSION_DEPTH--;
}
function overBudget(): boolean {
  return RECURSION_DEPTH > RECURSION_LIMIT;
}

type WeightedChoice<T> = [number, T | (() => T)];

function weighted<T>(choices: WeightedChoice<T>[]): T {
  let total = 0;
  for (const choice of choices) total += choice[0];
  let r = Math.random() * total;
  for (const choice of choices) {
    r -= choice[0];
    if (r <= 0) {
      const v = choice[1];
      return typeof v === "function" ? (v as () => T)() : v;
    }
  }
  const lastChoice = choices[choices.length - 1];
  const last = lastChoice ? lastChoice[1] : choices[0]?.[1];
  if (last === undefined) throw new Error("empty choices");
  return typeof last === "function" ? (last as () => T)() : last;
}

/* ---------- Name pools -------------------------------------- */

const VAR_NAMES = [
  // short classics
  "x",
  "y",
  "z",
  "i",
  "j",
  "k",
  "n",
  "m",
  "a",
  "b",
  "c",
  // everyday work names
  "count",
  "total",
  "result",
  "value",
  "values",
  "data",
  "items",
  "item",
  "index",
  "num",
  "acc",
  "temp",
  "buf",
  "key",
  "val",
  "name",
  "flag",
  "msg",
  "err",
  "code",
  "size",
  "length",
  "width",
  "height",
  "offset",
  // collections
  "arr",
  "lst",
  "nums",
  "pairs",
  "stack",
  "queue",
  "seen",
  "visited",
  "cache",
  "memo",
  "table",
  "graph",
  "tree",
  "grid",
  "board",
  // tree/graph
  "node",
  "left",
  "right",
  "parent",
  "child",
  "root",
  "head",
  "tail",
  "edge",
  "nbr",
  "src",
  "dst",
  // snake_case pairs
  "start_time",
  "end_time",
  "max_depth",
  "min_cost",
  "row_count",
  "col_count",
  "user_id",
  "file_name",
  "line_no",
  "char_count",
  "word_list",
  "prev_state",
  "next_state",
] as const;

function genName(): string {
  return weighted<string>([
    [50, () => VAR_NAMES[randInt(11)] as string],
    [35, () => VAR_NAMES[11 + randInt(27)] as string],
    [20, () => VAR_NAMES[38 + randInt(16)] as string],
    [15, () => VAR_NAMES[54 + randInt(12)] as string],
    [10, () => VAR_NAMES[66 + randInt(VAR_NAMES.length - 66)] as string],
  ]);
}

const FUNC_NAMES = [
  "compute",
  "process",
  "handle",
  "update",
  "parse",
  "validate",
  "check",
  "find",
  "build",
  "make_node",
  "get_value",
  "set_value",
  "solve",
  "search",
  "traverse",
  "visit",
  "collect",
  "run",
  "apply",
  "merge",
  "split",
  "flatten",
  "normalize",
  "encode",
  "decode",
  "load_data",
  "save_data",
  "dfs",
  "bfs",
  "step",
] as const;

const BUILTINS = [
  "print",
  "len",
  "range",
  "sum",
  "min",
  "max",
  "abs",
  "int",
  "str",
  "float",
  "bool",
  "list",
  "dict",
  "set",
  "tuple",
  "sorted",
  "reversed",
  "enumerate",
  "zip",
  "map",
  "filter",
  "any",
  "all",
  "type",
  "isinstance",
  "hasattr",
  "getattr",
  "round",
  "open",
] as const;

const METHODS = [
  "append",
  "pop",
  "extend",
  "insert",
  "remove",
  "clear",
  "copy",
  "keys",
  "values",
  "items",
  "get",
  "update",
  "split",
  "join",
  "strip",
  "replace",
  "find",
  "startswith",
  "endswith",
  "add",
  "discard",
  "index",
  "count",
] as const;

const MODULES = [
  "math",
  "os",
  "sys",
  "json",
  "re",
  "random",
  "collections",
  "itertools",
  "functools",
  "time",
  "pathlib",
] as const;

const STRING_WORDS = [
  "hello",
  "world",
  "ok",
  "done",
  "error",
  "warning",
  "info",
  "python",
  "foo",
  "bar",
  "baz",
  "name",
  "value",
  "result",
  "/tmp/data",
  "config",
  "token",
  "id",
] as const;

/* ---------- Terminals --------------------------------------- */

function genNumber(): string {
  return weighted<string>([
    [5, () => String(randInt(10))],
    [4, () => String(randInt(100))],
    [2, () => String(randInt(1000))],
    [1, "0"],
    [1, "1"],
    [1, "-1"],
    [1, () => (randInt(100) / 10).toFixed(1)],
  ]);
}

function genString(): string {
  const w = pick(STRING_WORDS);
  return weighted<string>([
    [5, '"' + w + '"'],
    [2, "'" + w + "'"],
    [1, 'f"' + w + " {" + genName() + '}"'],
  ]);
}

function genBool(): string {
  return weighted<string>([
    [3, "True"],
    [3, "False"],
    [1, "None"],
  ]);
}

/* ---------- Expression layer -------------------------------- */

function genAtom(depth: number): string {
  if (overBudget()) return genName();
  const rec = depth < 2 ? 1 : 0;
  enterRec();
  try {
    return weighted<string>([
      [8, () => genName()],
      [5, () => genNumber()],
      [3, () => genString()],
      [2, () => genBool()],
      [rec * 2, () => genList(depth + 1)],
      [rec, () => genTuple(depth + 1)],
      [rec, () => genDict(depth + 1)],
      [rec, () => genSet(depth + 1)],
    ]);
  } finally {
    exitRec();
  }
}

function genList(depth: number): string {
  if (coin(0.15)) return "[]";
  const n = weighted<number>([
    [3, 2],
    [3, 3],
    [2, 1],
    [1, 4],
  ]);
  const parts: string[] = [];
  for (let i = 0; i < n; i++) parts.push(genExpr(depth + 1));
  return "[" + parts.join(", ") + "]";
}

function genTuple(depth: number): string {
  const n = weighted<number>([
    [3, 2],
    [2, 3],
  ]);
  const parts: string[] = [];
  for (let i = 0; i < n; i++) parts.push(genExpr(depth + 1));
  return "(" + parts.join(", ") + ")";
}

function genDict(depth: number): string {
  if (coin(0.2)) return "{}";
  const n = weighted<number>([
    [3, 1],
    [3, 2],
    [1, 3],
  ]);
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    parts.push(genString() + ": " + genExpr(depth + 1));
  }
  return "{" + parts.join(", ") + "}";
}

function genSet(depth: number): string {
  const n = weighted<number>([
    [3, 2],
    [2, 3],
  ]);
  const parts: string[] = [];
  for (let i = 0; i < n; i++) parts.push(genAtom(depth + 1));
  return "{" + parts.join(", ") + "}";
}

function genCallArgs(depth: number): string {
  const n = weighted<number>([
    [2, 0],
    [5, 1],
    [3, 2],
    [1, 3],
  ]);
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    parts.push(depth < 2 ? genExpr(depth) : genAtom(depth));
  }
  return parts.join(", ");
}

function genPrimary(depth: number): string {
  if (overBudget()) return genName();
  let base = genAtom(depth);
  const ops =
    depth >= 2
      ? 0
      : weighted<number>([
          [10, 0],
          [3, 1],
          [1, 2],
        ]);
  for (let i = 0; i < ops; i++) {
    enterRec();
    try {
      base = weighted<string>([
        [
          3,
          () => base + "." + pick(METHODS) + "(" + genCallArgs(depth + 1) + ")",
        ],
        [2, () => base + "[" + genName() + "]"],
        [1, () => base + "." + genName()],
      ]);
    } finally {
      exitRec();
    }
  }
  return base;
}

function genCall(depth: number): string {
  const fn = weighted<string>([
    [5, () => pick(BUILTINS) as string],
    [3, () => pick(FUNC_NAMES) as string],
    [2, () => genName()],
  ]);
  return fn + "(" + genCallArgs(depth + 1) + ")";
}

function genBinOp(): string {
  return weighted<string>([
    [4, "+"],
    [3, "-"],
    [3, "*"],
    [2, "/"],
    [1, "//"],
    [1, "%"],
    [1, "**"],
  ]);
}

function genCmpOp(): string {
  return weighted<string>([
    [4, "=="],
    [2, "!="],
    [3, "<"],
    [3, ">"],
    [2, "<="],
    [2, ">="],
    [2, "in"],
    [1, "not in"],
    [1, "is"],
    [1, "is not"],
  ]);
}

function genExpr(depth = 0): string {
  if (depth > 2 || overBudget()) return genAtom(depth);
  enterRec();
  try {
    return weighted<string>([
      [10, () => genPrimary(depth)],
      [
        5,
        () =>
          genPrimary(depth) + " " + genBinOp() + " " + genPrimary(depth + 1),
      ],
      [4, () => genCall(depth + 1)],
      [
        3,
        () =>
          genPrimary(depth) + " " + genCmpOp() + " " + genPrimary(depth + 1),
      ],
      [1, () => "not " + genPrimary(depth + 1)],
      [1, () => "-" + genPrimary(depth + 1)],
      [
        1,
        () =>
          genPrimary(depth + 1) +
          " if " +
          genCondition(depth + 1) +
          " else " +
          genPrimary(depth + 1),
      ],
      [1, () => "lambda " + genName() + ": " + genPrimary(depth + 1)],
    ]);
  } finally {
    exitRec();
  }
}

function genCondition(depth = 0): string {
  if (depth > 2 || overBudget()) {
    return genName() + " " + genCmpOp() + " " + genNumber();
  }
  const body = (): string => {
    if (overBudget()) return genName();
    enterRec();
    try {
      return weighted<string>([
        [
          6,
          () =>
            genPrimary(depth + 1) +
            " " +
            genCmpOp() +
            " " +
            genPrimary(depth + 1),
        ],
        [3, () => genName() + " " + genCmpOp() + " " + genNumber()],
        [2, () => genName()],
        [1, () => "not " + genName()],
      ]);
    } finally {
      exitRec();
    }
  };
  return weighted<string>([
    [8, body],
    [2, () => body() + " and " + body()],
    [2, () => body() + " or " + body()],
  ]);
}

/* ---------- Comprehensions ---------------------------------- */

function genListComp(depth: number): string {
  const t = genName();
  const bodyStr = weighted<string>([
    [3, () => t],
    [2, () => t + " * " + genNumber()],
    [2, () => t + " + " + genNumber()],
    [1, () => pick(BUILTINS) + "(" + t + ")"],
  ]);
  let s = "[" + bodyStr + " for " + t + " in " + genIterable(depth + 1) + "]";
  if (coin(0.35)) {
    s =
      s.slice(0, -1) + " if " + t + " " + genCmpOp() + " " + genNumber() + "]";
  }
  return s;
}

function genIterable(depth: number): string {
  return weighted<string>([
    [4, () => "range(" + genNumber() + ")"],
    [3, () => genName()],
    [2, () => "enumerate(" + genName() + ")"],
    [1, () => genList(depth + 1)],
    [1, () => genName() + ".items()"],
  ]);
}

/* ---------- Simple statements ------------------------------- */

function genAssignment(): string {
  const rhs = weighted<string>([
    [5, () => genExpr()],
    [2, () => genCall(0)],
    [2, () => genListComp(0)],
  ]);
  const lhs = weighted<string>([
    [6, () => genName()],
    [1, () => genName() + ", " + genName()],
  ]);
  return lhs + " = " + rhs;
}

function genAugAssignment(): string {
  const op = weighted<string>([
    [5, "+="],
    [3, "-="],
    [2, "*="],
    [1, "/="],
    [1, "//="],
    [1, "%="],
    [1, "**="],
  ]);
  return genName() + " " + op + " " + genExpr();
}

function genReturn(): string {
  return coin(0.2) ? "return" : "return " + genExpr();
}

function genImport(): string {
  const mod = pick(MODULES);
  return weighted<string>([
    [3, "import " + mod],
    [
      2,
      "from " +
        mod +
        " import " +
        pick([
          "sqrt",
          "floor",
          "ceil",
          "pi",
          "log",
          "sin",
          "cos",
          "gcd",
        ] as const),
    ],
    [1, "import " + mod + " as " + mod[0]],
  ]);
}

function genRaise(): string {
  return (
    "raise " +
    pick([
      "ValueError",
      "TypeError",
      "KeyError",
      "IndexError",
      "RuntimeError",
    ] as const) +
    "(" +
    genString() +
    ")"
  );
}

function genSimpleStmt(): string {
  return weighted<string>([
    [8, () => genAssignment()],
    [4, () => genAugAssignment()],
    [4, () => genCall(0)],
    [3, () => "print(" + genExpr() + ")"],
    [2, () => genReturn()],
    [1, "pass"],
    [1, "break"],
    [1, "continue"],
    [1, () => genImport()],
    [1, () => genRaise()],
    [1, () => "assert " + genCondition()],
  ]);
}

/* ---------- Compound statements ----------------------------- */

function genBlock(indent: string, depth: number, maxLines = 3): string {
  const n = 1 + randInt(maxLines);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    out.push(indent + genStmtInBody(indent, depth + 1));
  }
  return out.join("\n");
}

function genStmtInBody(indent: string, depth: number): string {
  if (depth >= 2) return genSimpleStmt();
  return weighted<string>([
    [10, () => genSimpleStmt()],
    [2, () => genIfStmt(indent, depth)],
    [2, () => genForStmt(indent, depth)],
    [1, () => genWhileStmt(indent, depth)],
  ]);
}

function genIfStmt(outer: string, depth: number): string {
  const body = outer + "    ";
  let s = "if " + genCondition() + ":\n" + genBlock(body, depth);
  const extra = weighted<number>([
    [4, 0],
    [2, 1],
    [1, 2],
  ]);
  for (let i = 0; i < extra; i++) {
    s +=
      "\n" + outer + "elif " + genCondition() + ":\n" + genBlock(body, depth);
  }
  if (coin(0.45)) {
    s += "\n" + outer + "else:\n" + genBlock(body, depth);
  }
  return s;
}

function genForStmt(outer: string, depth: number): string {
  const body = outer + "    ";
  const target = weighted<string>([
    [5, () => genName()],
    [1, () => genName() + ", " + genName()],
  ]);
  return (
    "for " + target + " in " + genIterable(0) + ":\n" + genBlock(body, depth)
  );
}

function genWhileStmt(outer: string, depth: number): string {
  const body = outer + "    ";
  return "while " + genCondition() + ":\n" + genBlock(body, depth);
}

function genFuncDef(outer: string): string {
  const body = outer + "    ";
  const fname = pick(FUNC_NAMES);
  const nParams = weighted<number>([
    [2, 0],
    [4, 1],
    [4, 2],
    [2, 3],
  ]);
  const params: string[] = [];
  for (let i = 0; i < nParams; i++) params.push(genName());
  if (params.length > 0 && coin(0.3)) {
    params[params.length - 1] += "=" + genNumber();
  }
  let s = "def " + fname + "(" + params.join(", ") + "):\n";
  s += genBlock(body, 1, 4);
  if (coin(0.6)) s += "\n" + body + genReturn();
  return s;
}

function genClassDef(outer: string): string {
  const body = outer + "    ";
  const cname = pick([
    "Node",
    "Graph",
    "Tree",
    "Stack",
    "Queue",
    "Solver",
    "Buffer",
    "Cache",
    "Parser",
    "Counter",
  ] as const);
  const baseLine = coin(0.3) ? "(object)" : "";
  let s = "class " + cname + baseLine + ":\n";
  s += body + "def __init__(self, " + genName() + "):\n";
  const inner = body + "    ";
  const k = 1 + randInt(3);
  for (let i = 0; i < k; i++) {
    s += inner + "self." + genName() + " = " + genExpr() + "\n";
  }
  if (coin(0.6)) {
    s += body + "def " + pick(FUNC_NAMES) + "(self):\n";
    s += inner + genSimpleStmt() + "\n";
    s += inner + "return self." + genName();
  } else {
    s = s.replace(/\n$/, "");
  }
  return s;
}

/* ---------- Top-level driver -------------------------------- */

function genTopStatement(): string {
  return weighted<string>([
    [8, () => genSimpleStmt()],
    [4, () => genIfStmt("", 0)],
    [3, () => genForStmt("", 0)],
    [2, () => genWhileStmt("", 0)],
    [4, () => genFuncDef("")],
    [1, () => genClassDef("")],
  ]);
}

export function wordCount(s: string): number {
  const m = s.match(/\S+/g);
  return m ? m.length : 0;
}

export type GenerateOpts = {
  mode?: "time" | "words";
  target?: number;
};

export function generate(opts?: GenerateOpts): string {
  const mode = opts?.mode ?? "time";
  const target = opts?.target ?? (mode === "time" ? 60 : 30);

  const budget = mode === "words" ? target : Math.max(150, target * 5);

  const perStmtCap = Math.max(12, Math.min(30, Math.ceil(budget / 3)));

  const lines: string[] = [];
  let words = 0;
  let guard = 0;
  while (words < budget && guard < 4000) {
    guard++;
    RECURSION_DEPTH = 0;
    const stmt = genTopStatement();
    const sw = wordCount(stmt);
    if (sw > perStmtCap) continue;
    lines.push(stmt);
    words += sw;
  }
  let text = lines.join("\n");

  text = text
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n");
  return text;
}
