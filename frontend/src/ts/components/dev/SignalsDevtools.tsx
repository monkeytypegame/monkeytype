import type { TanStackDevtoolsSolidPlugin } from "@tanstack/solid-devtools";

import {
  createEffect,
  createSignal,
  For,
  JSXElement,
  on,
  Show,
} from "solid-js";

import { trackedSignals, type TrackedSignal } from "../../dev/signal-tracker";
import { Balloon } from "../common/Balloon";

type SignalGroup = { file: string; signals: TrackedSignal[] };

function buildGroups(): SignalGroup[] {
  const groupMap = new Map<string, TrackedSignal[]>();

  for (const s of trackedSignals) {
    // extract filename from source path (e.g. "/ts/states/core.ts:4:44" -> "states/core.ts")
    const match = /\/ts\/(.+?)(?::\d+)*(?:\)?)$/.exec(s.source);
    const group = match?.[1] ?? (s.source !== "" ? s.source : s.owner);
    const entries = groupMap.get(group) ?? [];
    entries.push(s);
    groupMap.set(group, entries);
  }

  return Array.from(groupMap.entries()).map(([file, signals]) => ({
    file,
    signals,
  }));
}

function formatValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return `${value}`;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return `[${typeof value}]`;
  }
}

function parseValue(input: string): unknown {
  const trimmed = input.trim();
  if (trimmed === "null") return null;
  if (trimmed === "undefined") return undefined;
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  const num = Number(trimmed);
  if (trimmed !== "" && !Number.isNaN(num)) return num;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return trimmed;
  }
}

function SignalRow(props: { signal: TrackedSignal }): JSXElement {
  const [flashing, setFlashing] = createSignal(false);
  const [editing, setEditing] = createSignal(false);
  const [editValue, setEditValue] = createSignal("");
  let initialized = false;

  createEffect(
    on(
      () => formatValue(props.signal.get()),
      () => {
        if (!initialized) {
          initialized = true;
          return;
        }
        setFlashing(true);
        setTimeout(() => setFlashing(false), 125);
      },
    ),
  );

  const startEditing = (): void => {
    setEditValue(formatValue(props.signal.get()));
    setEditing(true);
  };

  const commitEdit = (): void => {
    props.signal.set(parseValue(editValue()));
    setEditing(false);
  };

  const cancelEdit = (): void => {
    setEditing(false);
  };

  return (
    <tr
      class="border-b transition-colors duration-125"
      style={{
        "border-color": "#292E3D",
        "background-color": flashing() ? "rgba(83, 177, 253, 0.15)" : "",
      }}
    >
      <td class="w-50 px-2 py-1 whitespace-nowrap">
        <span class="mr-1">{props.signal.name}</span>
        <Balloon
          inline
          text={`type: ${props.signal.type}\nowner: ${props.signal.ownerChain || props.signal.owner}\nsource: ${props.signal.source}\ninitial: ${props.signal.initialValue}\nobservers: ${props.signal.getObserverCount()}\nvalue type: ${typeof props.signal.get()}`}
          position="right"
          length="xlarge"
          break
        >
          <span class="cursor-help text-[10px] opacity-30 hover:opacity-100">
            ?
          </span>
        </Balloon>
      </td>
      <td class="px-2 py-1 break-all">
        <Show
          when={editing()}
          fallback={
            <span
              class="cursor-pointer hover:underline"
              onClick={() => {
                const current = props.signal.get();
                if (typeof current === "boolean") {
                  props.signal.set(!current);
                } else {
                  startEditing();
                }
              }}
            >
              {formatValue(props.signal.get())}
            </span>
          }
        >
          <input
            type="text"
            value={editValue()}
            onInput={(e) => {
              e.preventDefault();
              e.stopImmediatePropagation();
              setEditValue(e.currentTarget.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") cancelEdit();
            }}
            ref={(el) => setTimeout(() => el.focus())}
            class="w-full rounded border px-1 py-0.5 text-xs text-text outline-none focus:border-main"
            style={{
              "background-color": "#313749",
              "border-color": "#414962",
            }}
          />
        </Show>
      </td>
      <td class="w-50 px-2 py-1 whitespace-nowrap">
        <Show
          when={editing()}
          fallback={
            <button
              type="button"
              class="cursor-pointer rounded px-1.5 py-0.5 text-xs text-text hover:brightness-125"
              style={{
                "background-color": "#313749",
                border: "1px solid #414962",
              }}
              onClick={startEditing}
            >
              edit
            </button>
          }
        >
          <div class="flex gap-1">
            <button
              type="button"
              class="cursor-pointer rounded px-1.5 py-0.5 text-xs text-text hover:brightness-125"
              style={{
                "background-color": "#313749",
                border: "1px solid #414962",
              }}
              onClick={commitEdit}
            >
              set
            </button>
            <button
              type="button"
              class="cursor-pointer rounded px-1.5 py-0.5 text-xs text-text/50 hover:text-text"
              onClick={cancelEdit}
            >
              cancel
            </button>
          </div>
        </Show>
      </td>
    </tr>
  );
}

function SignalGroupSection(props: { group: SignalGroup }): JSXElement {
  const [collapsed, setCollapsed] = createSignal(false);

  return (
    <div class="mb-4">
      <button
        type="button"
        class="mb-1 flex w-full cursor-pointer items-center gap-1 border-b px-2 py-1 text-left text-sm font-bold"
        style={{ color: "#53B1FD", "border-color": "#292E3D" }}
        onClick={() => setCollapsed((c) => !c)}
      >
        <span
          class="inline-block transition-transform duration-150"
          style={{
            transform: collapsed() ? "rotate(-90deg)" : "rotate(0deg)",
          }}
        >
          &#9660;
        </span>
        {props.group.file}
        <span class="ml-auto text-xs font-normal opacity-50">
          {props.group.signals.length}
        </span>
      </button>
      <Show when={!collapsed()}>
        <table class="w-full border-collapse">
          <tbody>
            <For each={props.group.signals}>
              {(signal) => <SignalRow signal={signal} />}
            </For>
          </tbody>
        </table>
      </Show>
    </div>
  );
}

function SignalsPanel(): JSXElement {
  const [search, setSearch] = createSignal("");
  const groups = buildGroups();

  const filteredGroups = (): SignalGroup[] => {
    const query = search().toLowerCase();
    if (query === "") return groups;
    return groups
      .map((group) => {
        if (group.file.toLowerCase().includes(query)) return group;
        const filtered = group.signals.filter((s) =>
          s.name.toLowerCase().includes(query),
        );
        return { file: group.file, signals: filtered };
      })
      .filter((group) => group.signals.length > 0);
  };

  return (
    <div class="relative max-h-100 overflow-scroll overflow-y-auto font-mono text-xs text-text">
      <div
        class="sticky top-0 z-10 p-3 pb-0"
        style={{ "background-color": "#1A1C24" }}
      >
        <input
          type="text"
          placeholder="Filter by signal or file name..."
          value={search()}
          onInput={(e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            setSearch(e.currentTarget.value);
          }}
          class="mb-3 w-full rounded border border-sub bg-bg px-2 py-1 text-xs text-text outline-none placeholder:text-sub focus:border-main"
          style={{
            "background-color": "#313749",
            "border-color": "#414962",
          }}
        />
      </div>
      <div class="px-3 pb-3">
        <For each={filteredGroups()}>
          {(group) => <SignalGroupSection group={group} />}
        </For>
      </div>
    </div>
  );
}

export function SignalsDevtoolsPlugin(): TanStackDevtoolsSolidPlugin {
  return {
    id: "core-signals",
    name: "Signals",
    render: () => <SignalsPanel />,
  };
}
