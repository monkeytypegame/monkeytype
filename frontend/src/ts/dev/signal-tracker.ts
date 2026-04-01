import { createSignal, DEV } from "solid-js";

export type TrackedSignal = {
  name: string;
  type: "signal" | "store";
  owner: string;
  ownerChain: string;
  source: string;
  initialValue: string;
  get: () => unknown;
  set: (v: unknown) => void;
  getObserverCount: () => number;
};

export const trackedSignals: TrackedSignal[] = [];

/** Internal Solid signal/store node shape (subset used by devtools) */
type SolidNode = {
  name?: string;
  value?: unknown;
  observers?: unknown[];
  fn?: unknown;
  graph?: SolidOwner;
};

type SolidOwner = {
  name?: string;
  component?: { name?: string };
  owner?: SolidOwner | null;
};

function getCallerInfo(): { isUserCode: boolean; source: string } {
  const stack = new Error().stack;
  if (stack === undefined) return { isUserCode: false, source: "" };
  const frames = stack.split("\n").slice(1);

  if (frames.some((f) => f.includes("useRefWithUtils"))) {
    return { isUserCode: false, source: "" };
  }

  for (const frame of frames.toReversed()) {
    if (frame === "") continue;
    if (frame.includes("signal-tracker")) continue;
    if (frame.includes("solid-js")) continue;
    if (frame.includes("@solid-refresh")) continue;
    const isUserCode = !frame.includes("node_modules");
    const urlMatch = /https?:\/\/[^/]+(\/[^?)]+)(?:\?[^:]*)?(:[\d:]+)/.exec(
      frame,
    );
    const source =
      urlMatch !== null ? `${urlMatch[1]}${urlMatch[2]}` : frame.trim();
    if (source.includes("AnimePresence")) {
      console.log(source, frames);
    }
    return { isUserCode, source };
  }
  return { isUserCode: false, source: "" };
}

function getOwnerChain(node: SolidNode): string {
  const names: string[] = [];
  let owner: SolidOwner | undefined | null = node.graph;
  while (owner !== undefined && owner !== null) {
    const ownerName = owner.name ?? owner.component?.name;
    if (ownerName !== undefined) names.push(ownerName);
    owner = owner.owner;
  }
  return names.join(" > ");
}

function getOwnerName(node: SolidNode): string {
  return node.graph?.name ?? node.graph?.component?.name ?? "unknown";
}

function getNodeName(node: SolidNode): string | undefined {
  return node.name ?? node.graph?.name ?? node.graph?.component?.name;
}

function formatInitialValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "number" || typeof value === "boolean") {
    return `${value}`;
  }
  try {
    const str = JSON.stringify(value);
    return str.length > 80 ? `${str.slice(0, 80)}...` : str;
  } catch {
    return `[${typeof value}]`;
  }
}

if (DEV) {
  type NodeInfo = {
    name: string;
    type: "signal" | "store";
    source: string;
    ownerChain: string;
    initialValue: string;
  };
  const pendingNodes = new Map<SolidNode, NodeInfo>();

  const writeSignal = DEV.writeSignal as (
    node: SolidNode,
    value: unknown,
  ) => unknown;

  DEV.hooks.afterRegisterGraph = (rawNode: object) => {
    const node = rawNode as SolidNode;
    const isSignal = "observers" in node;
    const isStore = !isSignal && "value" in node && !("fn" in node);
    if (!isSignal && !isStore) return;

    // cheap check: must have a name
    const name = getNodeName(node);
    if (name === undefined) return;

    // expensive check: stack trace for user code filtering
    const { isUserCode, source } = getCallerInfo();
    if (!isUserCode) return;

    pendingNodes.set(node, {
      name,
      type: isSignal ? "signal" : "store",
      source,
      ownerChain: getOwnerChain(node),
      initialValue: formatInitialValue(node.value),
    });
  };

  queueMicrotask(() => {
    const mirrors: { node: SolidNode; set: (v: unknown) => void }[] = [];

    for (const [node, info] of pendingNodes) {
      const [get, set] = createSignal<unknown>(node.value);

      trackedSignals.push({
        name: info.name,
        type: info.type,
        owner: getOwnerName(node),
        ownerChain: info.ownerChain,
        source: info.source,
        initialValue: info.initialValue,
        get,
        set: (v: unknown) => writeSignal(node, v),
        getObserverCount: () => node.observers?.length ?? 0,
      });

      mirrors.push({ node, set });
    }
    pendingNodes.clear();

    // Sync node values to reactive mirrors, only when tab is visible
    const syncLoop = (): void => {
      for (const mirror of mirrors) {
        mirror.set(() => mirror.node.value);
      }
      requestAnimationFrame(syncLoop);
    };
    requestAnimationFrame(syncLoop);
  });
}
