import {
  createEffect,
  createMemo,
  createSignal,
  For,
  JSXElement,
  Show,
  untrack,
} from "solid-js";

import type {
  InputEventNoMs,
  TestEvent,
  TestEventType,
} from "../../test/events/types";

import { hideModal } from "../../states/modals";
import { getInputFromDom } from "../../test/events/helpers";
import { cn } from "../../utils/cn";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";

type TestContext = {
  events: TestEvent[];
  words: string[];
};

type Stage = "input" | "preview";

const EVENT_TYPES: TestEventType[] = [
  "input",
  "keydown",
  "keyup",
  "timer",
  "composition",
];

const TIMELINE_TRACK_HEIGHT = 8;
const TIMELINE_TRACK_GAP = 2;
const TIMELINE_LANE_GAP = 6;
const TIMELINE_PADDING_MS = 125;

const TYPE_BG: Record<TestEventType, string> = {
  keydown: "bg-text",
  keyup: "bg-error",
  input: "bg-main",
  timer: "bg-sub",
  composition: "bg-sub-alt",
};

type TimelineSegment = {
  start: number;
  end: number;
  kind: "bar" | "dot";
  type: TestEventType;
  label?: string;
  topPx: number;
  bg?: string;
};

type RawSegment = Omit<TimelineSegment, "topPx">;

function buildLanes(
  events: TestEvent[],
  visible: Set<TestEventType>,
): { segments: TimelineSegment[]; totalHeight: number } {
  const byType = new Map<TestEventType, RawSegment[]>();
  for (const t of EVENT_TYPES) byType.set(t, []);

  const pairKeys = visible.has("keydown") && visible.has("keyup");
  const pendingDown = new Map<string, number>();

  for (const e of events) {
    if (e.type === "keydown") {
      if (pairKeys) {
        pendingDown.set(e.data.code, e.testMs);
      } else if (visible.has("keydown")) {
        byType.get("keydown")?.push({
          start: e.testMs,
          end: e.testMs,
          kind: "dot",
          type: "keydown",
          label: e.data.code,
        });
      }
    } else if (e.type === "keyup") {
      if (pairKeys) {
        const start = pendingDown.get(e.data.code);
        if (start !== undefined) {
          byType.get("keydown")?.push({
            start,
            end: e.testMs,
            kind: "bar",
            type: "keydown",
            label: e.data.code,
          });
          pendingDown.delete(e.data.code);
        } else {
          byType.get("keyup")?.push({
            start: e.testMs,
            end: e.testMs,
            kind: "dot",
            type: "keyup",
            label: e.data.code,
          });
        }
      } else if (visible.has("keyup")) {
        byType.get("keyup")?.push({
          start: e.testMs,
          end: e.testMs,
          kind: "dot",
          type: "keyup",
          label: e.data.code,
        });
      }
    } else if (visible.has(e.type)) {
      const seg: RawSegment = {
        start: e.testMs,
        end: e.testMs,
        kind: "dot",
        type: e.type,
      };
      if (e.type === "input" && e.data.inputType.startsWith("delete")) {
        seg.bg = "bg-error";
      }
      byType.get(e.type)?.push(seg);
    }
  }

  if (pairKeys) {
    for (const [code, start] of pendingDown) {
      byType.get("keydown")?.push({
        start,
        end: start,
        kind: "dot",
        type: "keydown",
        label: code,
      });
    }
  }

  const segments: TimelineSegment[] = [];
  let y = 0;
  let firstLane = true;

  for (const t of EVENT_TYPES) {
    const segs = byType.get(t) ?? [];
    if (segs.length === 0) continue;
    if (!firstLane) y += TIMELINE_LANE_GAP;
    firstLane = false;

    const sorted = [...segs].sort((a, b) => a.start - b.start);
    let tracksUsed = 1;

    if (t === "keydown") {
      const trackEnds: number[] = [];
      for (const seg of sorted) {
        let track = trackEnds.findIndex((end) => end < seg.start);
        if (track === -1) {
          track = trackEnds.length;
          trackEnds.push(seg.end);
        } else {
          trackEnds[track] = seg.end;
        }
        segments.push({
          ...seg,
          topPx: y + track * (TIMELINE_TRACK_HEIGHT + TIMELINE_TRACK_GAP),
        });
      }
      tracksUsed = Math.max(1, trackEnds.length);
    } else {
      for (const seg of sorted) {
        segments.push({ ...seg, topPx: y });
      }
    }

    y +=
      tracksUsed * TIMELINE_TRACK_HEIGHT +
      (tracksUsed - 1) * TIMELINE_TRACK_GAP;
  }

  return { segments, totalHeight: Math.max(y, TIMELINE_TRACK_HEIGHT) };
}

function parseContext(raw: string): TestContext {
  const parsed = JSON.parse(raw) as unknown;
  if (typeof parsed !== "object") {
    throw new Error("Expected an object");
  }
  if (parsed === null) {
    throw new Error("Expected an object, got null");
  }
  if (!("events" in parsed) || !("words" in parsed)) {
    throw new Error("Expected { events: TestEvent[], words: string[] }");
  }
  if (typeof parsed.words === "string") {
    parsed.words = parsed.words.split(" ");
  }
  if (!Array.isArray((parsed as TestContext).events)) {
    throw new Error("Expected { events: TestEvent[], words: string[] }");
  }
  if (!Array.isArray((parsed as TestContext).words)) {
    throw new Error("Expected { events: TestEvent[], words: string[] }");
  }
  return parsed as TestContext;
}

function visualizeWhitespace(s: string): string {
  return s.replace(/ /g, "␣").replace(/\t/g, "→").replace(/\n/g, "↵");
}

function inputsPerWord(events: TestEvent[], wordCount: number): string[] {
  const buckets = new Map<number, InputEventNoMs[]>();
  for (const e of events) {
    if (e.type !== "input") continue;
    const bucket = buckets.get(e.data.wordIndex) ?? [];
    bucket.push(e);
    buckets.set(e.data.wordIndex, bucket);
  }
  return Array.from({ length: wordCount }, (_, i) =>
    getInputFromDom(buckets.get(i) ?? []),
  );
}

export function TestDataPreviewModal(): JSXElement {
  const [stage, setStage] = createSignal<Stage>("input");
  const [raw, setRaw] = createSignal("");
  const [ctx, setCtx] = createSignal<TestContext | null>(null);
  const [err, setErr] = createSignal<string | null>(null);

  const reset = (): void => {
    setStage("input");
    setRaw("");
    setCtx(null);
    setErr(null);
  };

  const onShow = (): void => {
    try {
      const parsed = parseContext(raw());
      setCtx(parsed);
      setErr(null);
      setStage("preview");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <AnimatedModal
      id="TestDataPreview"
      title="Test Data Preview"
      modalClass="max-w-full"
      beforeShow={reset}
    >
      <Show when={stage() === "input"}>
        <div class="flex flex-col gap-4">
          <textarea
            class="bg-bg-secondary h-64 w-full rounded p-2 font-mono text-xs text-text"
            placeholder='{"events": [...], "words": [...]}'
            value={raw()}
            onInput={(e) => setRaw(e.currentTarget.value)}
            autocomplete="off"
          ></textarea>
          <Show when={err()}>
            <div class="text-sm text-error">{err()}</div>
          </Show>
          <div class="flex justify-end gap-2">
            <Button
              variant="button"
              onClick={() => hideModal("TestDataPreview")}
              text="Cancel"
            />
            <Button variant="button" onClick={onShow} text="Show" />
          </div>
        </div>
      </Show>
      <Show when={stage() === "preview" && ctx() !== null}>
        <PreviewContent
          ctx={ctx() as TestContext}
          onBack={() => setStage("input")}
        />
      </Show>
    </AnimatedModal>
  );
}

function PreviewContent(props: {
  ctx: TestContext;
  onBack: () => void;
}): JSXElement {
  const maxMs = untrack(() =>
    Math.ceil(
      props.ctx.events.reduce((m, e) => (e.testMs > m ? e.testMs : m), 0),
    ),
  );
  const timelineMinMs = -TIMELINE_PADDING_MS;
  const timelineMaxMs = maxMs + TIMELINE_PADDING_MS;

  const [currentMs, setCurrentMs] = createSignal(maxMs);

  const visibleEvents = createMemo(() =>
    props.ctx.events.filter((e) => e.testMs <= currentMs()),
  );

  const finalInputs = untrack(() =>
    inputsPerWord(props.ctx.events, props.ctx.words.length),
  );

  const liveInputs = createMemo(() =>
    inputsPerWord(visibleEvents(), props.ctx.words.length),
  );

  const simulatedInput = createMemo(() =>
    visualizeWhitespace(
      liveInputs()
        .filter((w) => w.length > 0)
        .join(""),
    ),
  );

  const currentWordIndex = createMemo(() => {
    const ev = visibleEvents();
    for (let i = ev.length - 1; i >= 0; i--) {
      const e = ev[i];
      if (e?.type === "input") return e.data.wordIndex;
    }
    return -1;
  });

  const [visibleTypes, setVisibleTypes] = createSignal<Set<TestEventType>>(
    new Set(EVENT_TYPES),
  );

  const toggleType = (t: TestEventType): void => {
    setVisibleTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  const filteredEvents = createMemo(() =>
    props.ctx.events.filter((e) => visibleTypes().has(e.type)),
  );

  const timelineLanes = createMemo(() =>
    buildLanes(props.ctx.events, visibleTypes()),
  );

  const currentEventIndex = createMemo(() => {
    const events = filteredEvents();
    let idx = -1;
    let best = -Infinity;
    for (let i = 0; i < events.length; i++) {
      const ms = (events[i] as TestEvent).testMs;
      if (ms <= currentMs() && ms > best) {
        idx = i;
        best = ms;
      }
    }
    return idx;
  });

  let wordsScrollEl: HTMLDivElement | undefined;
  let eventsScrollEl: HTMLDivElement | undefined;

  const scrollRowIntoView = (
    container: HTMLDivElement | undefined,
    idx: number,
  ): void => {
    if (container === undefined || idx < 0) return;
    const row = container.querySelector<HTMLElement>(`[data-row="${idx}"]`);
    if (row === null) return;
    const containerRect = container.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const stickyHead =
      container.querySelector<HTMLElement>("thead")?.getBoundingClientRect()
        .height ?? 0;
    if (rowRect.top < containerRect.top + stickyHead) {
      container.scrollTop -= containerRect.top + stickyHead - rowRect.top;
    } else if (rowRect.bottom > containerRect.bottom) {
      container.scrollTop += rowRect.bottom - containerRect.bottom;
    }
  };

  createEffect(() => {
    scrollRowIntoView(wordsScrollEl, currentWordIndex());
  });

  createEffect(() => {
    scrollRowIntoView(eventsScrollEl, currentEventIndex());
  });

  return (
    <div class="flex flex-col gap-4">
      <div class="flex justify-start">
        <Button
          variant="button"
          onClick={props.onBack}
          fa={{ icon: "fa-arrow-left" }}
          text="Back"
        />
      </div>

      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <div class="text-sm text-sub">Time</div>
          <div class="font-mono text-xs text-sub">
            {currentMs()} / {maxMs} ms
          </div>
        </div>
        <Timeline
          segments={timelineLanes().segments}
          totalHeight={timelineLanes().totalHeight}
          minMs={timelineMinMs}
          maxMs={timelineMaxMs}
          currentMs={currentMs()}
          onSeek={setCurrentMs}
        />
        {/* <input
          type="range"
          min="0"
          max={maxMs}
          step="1"
          value={currentMs()}
          onInput={(e) => setCurrentMs(Number(e.currentTarget.value))}
          class="w-full"
        /> */}
      </div>

      <div class="flex flex-col gap-2">
        <div class="text-sm text-sub">Simulated input</div>
        <div class="bg-bg-secondary min-h-10 rounded p-2 font-mono text-sm break-all whitespace-pre-wrap">
          {simulatedInput()}
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <div class="text-sm text-sub">Words</div>
        <div
          ref={(el) => (wordsScrollEl = el)}
          class="bg-bg-secondary max-h-64 overflow-auto rounded"
        >
          <table class="w-full text-xs">
            <thead class="bg-bg-secondary sticky top-0">
              <tr class="text-sub">
                <th class="w-10 p-2 text-right">#</th>
                <th class="p-2 text-left">target</th>
                <th class="p-2 text-left">input</th>
              </tr>
            </thead>
            <tbody>
              <For each={props.ctx.words}>
                {(word, i) => (
                  <tr
                    data-row={i()}
                    class={cn(
                      "border-t border-bg",
                      i() === currentWordIndex() && "bg-main/20",
                    )}
                  >
                    <td class="p-2 text-right font-mono text-sub">{i()}</td>
                    <td class="p-2 font-mono">{visualizeWhitespace(word)}</td>
                    <td class="p-2 font-mono">
                      {visualizeWhitespace(finalInputs[i()] ?? "")}
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <div class="text-sm text-sub">
            Events ({filteredEvents().length}/{props.ctx.events.length})
          </div>
          <div class="flex flex-wrap gap-2">
            <For each={EVENT_TYPES}>
              {(t) => (
                <Button
                  variant="button"
                  active={visibleTypes().has(t)}
                  onClick={() => toggleType(t)}
                  text={t}
                  class="text-xs"
                />
              )}
            </For>
          </div>
        </div>
        <div
          ref={(el) => (eventsScrollEl = el)}
          class="bg-bg-secondary max-h-96 overflow-auto rounded"
        >
          <table class="w-full text-xs">
            <thead class="bg-bg-secondary sticky top-0">
              <tr class="text-sub">
                <th class="w-24 p-2 text-right">time</th>
                <th class="w-24 p-2 text-left">type</th>
                <th class="p-2 text-left">data</th>
              </tr>
            </thead>
            <tbody>
              <For each={filteredEvents()}>
                {(event, i) => (
                  <tr
                    data-row={i()}
                    class={cn(
                      "border-t border-bg",
                      i() === currentEventIndex() && "bg-main/20",
                      event.testMs > currentMs() && "opacity-40",
                    )}
                  >
                    <td class="p-2 text-right font-mono">
                      {event.testMs.toFixed(2)}
                    </td>
                    <td class="p-2 font-mono">{event.type}</td>
                    <td class="p-2 font-mono break-all">
                      {JSON.stringify(event.data)}
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Timeline(props: {
  segments: TimelineSegment[];
  totalHeight: number;
  minMs: number;
  maxMs: number;
  currentMs: number;
  onSeek: (ms: number) => void;
}): JSXElement {
  const range = (): number => Math.max(props.maxMs - props.minMs, 1);
  const scale = (ms: number): number => ((ms - props.minMs) / range()) * 100;
  const dotSize = 4;
  const dotOffset = (TIMELINE_TRACK_HEIGHT - dotSize) / 2;

  const [zoom, setZoom] = createSignal(1);
  let scrollEl: HTMLDivElement | undefined;
  let containerEl: HTMLDivElement | undefined;

  const seekFromPointer = (clientX: number): void => {
    if (containerEl === undefined) return;
    const rect = containerEl.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    props.onSeek(Math.round(props.minMs + pct * range()));
  };

  const onPointerDown = (e: PointerEvent): void => {
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    seekFromPointer(e.clientX);
  };

  const onPointerMove = (e: PointerEvent): void => {
    const el = e.currentTarget as HTMLDivElement;
    if (!el.hasPointerCapture(e.pointerId)) return;
    seekFromPointer(e.clientX);
  };

  const onPointerUp = (e: PointerEvent): void => {
    const el = e.currentTarget as HTMLDivElement;
    if (el.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
  };

  const onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    if (scrollEl === undefined) return;
    const rect = scrollEl.getBoundingClientRect();
    const viewX = e.clientX - rect.left;
    const contentX = viewX + scrollEl.scrollLeft;
    const oldZoom = zoom();
    const factor = e.deltaY > 0 ? 1 / 1.2 : 1.2;
    const newZoom = Math.max(1, Math.min(50, oldZoom * factor));
    if (newZoom === oldZoom) return;
    setZoom(newZoom);
    requestAnimationFrame(() => {
      if (scrollEl === undefined) return;
      const newContentX = contentX * (newZoom / oldZoom);
      scrollEl.scrollLeft = newContentX - viewX;
    });
  };

  return (
    <div
      ref={(el) => (scrollEl = el)}
      class="relative w-full overflow-x-auto"
      onWheel={onWheel}
    >
      <div
        ref={(el) => (containerEl = el)}
        class="relative cursor-ew-resize touch-none overflow-hidden bg-bg select-none"
        style={{
          height: `${props.totalHeight}px`,
          width: `${zoom() * 100}%`,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <For each={props.segments}>
          {(seg) => {
            if (seg.kind === "bar") {
              return (
                <div
                  title={seg.label}
                  class={cn(
                    "absolute rounded-[2px]",
                    seg.bg ?? TYPE_BG[seg.type],
                  )}
                  style={{
                    left: `${scale(seg.start)}%`,
                    width: `max(${((seg.end - seg.start) / range()) * 100}%, 2px)`,
                    top: `${seg.topPx}px`,
                    height: `${TIMELINE_TRACK_HEIGHT}px`,
                  }}
                ></div>
              );
            }
            return (
              <div
                title={seg.label}
                class={cn("absolute rounded-full", seg.bg ?? TYPE_BG[seg.type])}
                style={{
                  left: `calc(${scale(seg.start)}% - ${dotSize / 2}px)`,
                  width: `${dotSize}px`,
                  height: `${dotSize}px`,
                  top: `${seg.topPx + dotOffset}px`,
                }}
              ></div>
            );
          }}
        </For>
        <div
          class="absolute top-0 bottom-0 w-px bg-main"
          style={{
            left: `${scale(props.currentMs)}%`,
            transform: "translateX(-50%)",
          }}
        ></div>
      </div>
    </div>
  );
}
