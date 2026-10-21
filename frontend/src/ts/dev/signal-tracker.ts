import { createSignal, DEV } from "solid-js";
import { DEV as STORE_DEV } from "solid-js/store";
import { isProfilerMode } from "../utils/profiler-mode";

export type TrackedSignal = {
  name: string;
  type: "signal" | "store";
  owner: string;
  ownerChain: string;
  source: string;
  initialValue: string;
  /** Reactive, synced once per animation frame (paused in hidden tabs). For UI. */
  get: () => unknown;
  /** Current value, read straight from the node. */
  peek: () => unknown;
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
  const frames = stack.split("\n");

  if (frames.some((f) => f.includes("useRefWithUtils"))) {
    return { isUserCode: false, source: "" };
  }

  for (const frame of frames.toReversed()) {
    if (frame === "" || frame === "Error") continue;
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

function snapshotValue(value: unknown): string {
  try {
    return JSON.stringify(value) ?? "undefined";
  } catch {
    return `[${typeof value}]`;
  }
}

if (DEV && !isProfilerMode()) {
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
    // signals are registered in batches - module load, component mounts, hot
    // reloads - so flush after each batch rather than once at startup
    if (!isFlushQueued) {
      isFlushQueued = true;
      queueMicrotask(flush);
    }
  };

  type Mirror = {
    node: SolidNode;
    set: (v: unknown) => void;
    /** stores only: serialized value from the last sync */
    snapshot?: string;
  };
  const mirrors = new Map<TrackedSignal, Mirror>();
  let isFlushQueued = false;

  // stores mutate in place, so their node value keeps the same reference -
  // mark any store write and compare snapshots on the next sync instead
  let isStoreDirty = false;
  if (STORE_DEV !== undefined) {
    type StoreHook = NonNullable<typeof STORE_DEV.hooks.onStoreNodeUpdate>;
    // solid-devtools assigns this hook on load without chaining, so keep ours
    // in front of whatever gets assigned later
    let otherHook = STORE_DEV.hooks.onStoreNodeUpdate ?? null;
    const hook: StoreHook = (...args) => {
      isStoreDirty = true;
      otherHook?.(...args);
    };
    Object.defineProperty(STORE_DEV.hooks, "onStoreNodeUpdate", {
      configurable: true,
      enumerable: true,
      get: () => hook,
      set: (fn: StoreHook | null) => {
        otherHook = fn;
      },
    });
  }

  const flush = (): void => {
    isFlushQueued = false;
    for (const [node, info] of pendingNodes) {
      // a hot reloaded module recreates its signals - the newest one wins
      const index = trackedSignals.findIndex(
        (s) => s.name === info.name && s.source === info.source,
      );
      if (index !== -1) {
        const [stale] = trackedSignals.splice(index, 1);
        if (stale !== undefined) mirrors.delete(stale);
      }

      const isStore = info.type === "store";
      const [get, set] = createSignal(node.value, {
        equals: isStore ? false : undefined,
      });
      const tracked: TrackedSignal = {
        name: info.name,
        type: info.type,
        owner: getOwnerName(node),
        ownerChain: info.ownerChain,
        source: info.source,
        initialValue: info.initialValue,
        get,
        peek: () => node.value,
        set: (v: unknown) => writeSignal(node, v),
        getObserverCount: () => node.observers?.length ?? 0,
      };
      trackedSignals.push(tracked);
      mirrors.set(tracked, {
        node,
        set,
        snapshot: isStore ? snapshotValue(node.value) : undefined,
      });
    }
    pendingNodes.clear();
  };

  // sync node values to the reactive mirrors, only while the tab is visible
  const syncLoop = (): void => {
    const syncStores = isStoreDirty;
    isStoreDirty = false;
    for (const mirror of mirrors.values()) {
      const { node, set } = mirror;
      if (mirror.snapshot === undefined) {
        set(() => node.value);
        continue;
      }
      if (!syncStores) continue;
      const snapshot = snapshotValue(node.value);
      if (snapshot === mirror.snapshot) continue;
      mirror.snapshot = snapshot;
      set(() => node.value);
    }
    requestAnimationFrame(syncLoop);
  };
  requestAnimationFrame(syncLoop);
}
