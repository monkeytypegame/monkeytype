import {
  createEffect,
  createMemo,
  createSignal,
  For,
  JSXElement,
  onCleanup,
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
  const [videoUrl, setVideoUrl] = createSignal<string | null>(null);
  const [videoEl, setVideoEl] = createSignal<HTMLVideoElement | undefined>(
    undefined,
  );
  const [videoDurationMs, setVideoDurationMs] = createSignal<number | null>(
    null,
  );

  type SyncKind = "start" | "end";
  type Mark = { id: string; videoMs: number; sync?: SyncKind };

  let nextMarkSerial = 0;
  const generateMarkId = (): string => `mark-${++nextMarkSerial}`;

  const [marks, setMarks] = createSignal<Mark[]>([]);
  // eventIndex (index into props.ctx.events) → mark id
  const [eventToMark, setEventToMark] = createSignal<Record<number, string>>(
    {},
  );

  const syncStartMark = createMemo(() =>
    marks().find((m) => m.sync === "start"),
  );
  const syncEndMark = createMemo(() => marks().find((m) => m.sync === "end"));

  const eventIndexForMark = (id: string): number | undefined => {
    const assignments = eventToMark();
    for (const [k, v] of Object.entries(assignments)) {
      if (v === id) return Number(k);
    }
    return undefined;
  };

  const syncStartEvent = createMemo(() => {
    const m = syncStartMark();
    if (m === undefined) return undefined;
    const idx = eventIndexForMark(m.id);
    if (idx === undefined) return undefined;
    return props.ctx.events[idx];
  });
  const syncEndEvent = createMemo(() => {
    const m = syncEndMark();
    if (m === undefined) return undefined;
    const idx = eventIndexForMark(m.id);
    if (idx === undefined) return undefined;
    return props.ctx.events[idx];
  });

  const isSyncable = createMemo(
    () => syncStartEvent() !== undefined && syncEndEvent() !== undefined,
  );
  const [syncEnabled, setSyncEnabled] = createSignal(false);
  const isSynced = createMemo(() => isSyncable() && syncEnabled());

  createEffect(() => {
    if (!isSyncable() && syncEnabled()) setSyncEnabled(false);
  });

  const toggleSync = (): void => {
    if (!isSyncable()) return;
    setSyncEnabled(!syncEnabled());
  };

  const videoMapping = createMemo((): { startEff: number; slope: number } => {
    if (!isSynced()) return { startEff: 0, slope: 1 };
    const sM = syncStartMark() as Mark;
    const eM = syncEndMark() as Mark;
    const sE = syncStartEvent() as TestEvent;
    const eE = syncEndEvent() as TestEvent;
    const a = sE.testMs;
    const b = eE.testMs;
    if (b === a) return { startEff: sM.videoMs, slope: 1 };
    const slope = (eM.videoMs - sM.videoMs) / (b - a);
    return { startEff: sM.videoMs - a * slope, slope };
  });

  const testMsToVideoMs = (testMs: number): number => {
    const { startEff, slope } = videoMapping();
    return startEff + testMs * slope;
  };

  const videoMsToTestMs = (videoMs: number): number => {
    const { startEff, slope } = videoMapping();
    if (slope === 0) return 0;
    return (videoMs - startEff) / slope;
  };

  const videoBarRange = createMemo(() => {
    if (!isSynced()) return undefined;
    const dur = videoDurationMs();
    if (dur === null) return undefined;
    const start = videoMsToTestMs(0);
    const end = videoMsToTestMs(dur);
    return { start, end };
  });

  const timelineMarks = createMemo(
    (): { testMs: number; label: string; sync?: SyncKind }[] => {
      if (!isSynced()) return [];
      return marks().map((m) => ({
        testMs: videoMsToTestMs(m.videoMs),
        label: m.sync ?? m.id,
        sync: m.sync,
      }));
    },
  );

  const driftData = createMemo(
    (): { eventTestMs: number; driftMs: number; label: string }[] => {
      if (!isSynced()) return [];
      const points: { eventTestMs: number; driftMs: number; label: string }[] =
        [];
      for (const mark of marks()) {
        if (mark.sync !== undefined) continue;
        const idx = eventIndexForMark(mark.id);
        if (idx === undefined) continue;
        const event = props.ctx.events[idx];
        if (event === undefined) continue;
        const mappedTestMs = videoMsToTestMs(mark.videoMs);
        points.push({
          eventTestMs: event.testMs,
          driftMs: mappedTestMs - event.testMs,
          label: mark.id,
        });
      }
      points.sort((a, b) => a.eventTestMs - b.eventTestMs);
      return points;
    },
  );

  const timelineMinMs = createMemo(() => {
    const bar = videoBarRange();
    let min = -TIMELINE_PADDING_MS;
    if (bar !== undefined) {
      min = Math.min(min, bar.start - TIMELINE_PADDING_MS);
    }
    return min;
  });
  const timelineMaxMs = createMemo(() => {
    const bar = videoBarRange();
    let max = maxMs + TIMELINE_PADDING_MS;
    if (bar !== undefined) {
      max = Math.max(max, bar.end + TIMELINE_PADDING_MS);
    }
    return max;
  });

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

  const filteredEventsWithIndex = createMemo(() =>
    props.ctx.events
      .map((event, originalIndex) => ({ event, originalIndex }))
      .filter(({ event }) => visibleTypes().has(event.type)),
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

  const [timelinePlaying, setTimelinePlaying] = createSignal(false);
  let rafId: number | undefined;
  let lastFrame: number | undefined;

  const playing = createMemo(() =>
    isSynced() ? videoPlayState() : timelinePlaying(),
  );

  const stopTimelinePlay = (): void => {
    if (rafId !== undefined) cancelAnimationFrame(rafId);
    rafId = undefined;
    lastFrame = undefined;
    setTimelinePlaying(false);
  };

  const tick = (now: number): void => {
    if (lastFrame === undefined) {
      lastFrame = now;
      rafId = requestAnimationFrame(tick);
      return;
    }
    const dt = now - lastFrame;
    lastFrame = now;
    const next = currentMs() + dt;
    if (next >= timelineMaxMs()) {
      setCurrentMs(timelineMaxMs());
      stopTimelinePlay();
      return;
    }
    setCurrentMs(Math.round(next));
    rafId = requestAnimationFrame(tick);
  };

  const togglePlay = (): void => {
    if (isSynced()) {
      const el = videoEl();
      if (el === undefined) return;
      if (el.paused) {
        if (currentMs() >= timelineMaxMs()) setCurrentMs(timelineMinMs());
        void el.play().catch(() => undefined);
      } else {
        el.pause();
      }
      return;
    }
    if (timelinePlaying()) {
      stopTimelinePlay();
    } else {
      if (currentMs() >= timelineMaxMs()) setCurrentMs(timelineMinMs());
      setTimelinePlaying(true);
      lastFrame = undefined;
      rafId = requestAnimationFrame(tick);
    }
  };

  onCleanup(stopTimelinePlay);

  const stopAllPlay = (): void => {
    stopTimelinePlay();
    const el = videoEl();
    if (el !== undefined && isSynced() && !el.paused) el.pause();
  };

  const step = (delta: number): void => {
    stopAllPlay();
    const next = Math.max(
      timelineMinMs(),
      Math.min(timelineMaxMs(), currentMs() + delta),
    );
    setCurrentMs(next);
  };

  const goToStart = (): void => {
    stopAllPlay();
    setCurrentMs(timelineMinMs());
  };

  const goToEnd = (): void => {
    stopAllPlay();
    setCurrentMs(timelineMaxMs());
  };

  const goNextEvent = (): void => {
    stopAllPlay();
    const events = filteredEvents();
    let bestMs: number | null = null;
    for (const e of events) {
      if (e.testMs > currentMs() && (bestMs === null || e.testMs < bestMs)) {
        bestMs = e.testMs;
      }
    }
    setCurrentMs(bestMs ?? timelineMaxMs());
  };

  const goPrevEvent = (): void => {
    stopAllPlay();
    const events = filteredEvents();
    let bestMs: number | null = null;
    for (const e of events) {
      if (e.testMs < currentMs() && (bestMs === null || e.testMs > bestMs)) {
        bestMs = e.testMs;
      }
    }
    setCurrentMs(bestMs ?? timelineMinMs());
  };

  const onPickVideo = (e: Event): void => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (file === undefined) return;
    const prev = videoUrl();
    if (prev !== null) URL.revokeObjectURL(prev);
    setVideoUrl(URL.createObjectURL(file));
  };

  const clearVideo = (): void => {
    const url = videoUrl();
    if (url !== null) URL.revokeObjectURL(url);
    setVideoUrl(null);
    setVideoDurationMs(null);
  };

  onCleanup(() => {
    const url = videoUrl();
    if (url !== null) URL.revokeObjectURL(url);
  });

  createEffect(() => {
    const el = videoEl();
    if (el === undefined) return;
    if (!isSynced()) return;
    if (videoPlayState()) return;
    const t = testMsToVideoMs(currentMs()) / 1000;
    if (!Number.isFinite(t) || t < 0) return;
    if (Number.isFinite(el.duration) && t > el.duration) return;
    if (Math.abs(el.currentTime - t) > 0.001) {
      el.currentTime = t;
    }
  });

  const addMark = (sync?: SyncKind): void => {
    const el = videoEl();
    if (el === undefined) return;
    if (sync !== undefined && marks().some((m) => m.sync === sync)) return;
    const frameMs = videoFrameTimeMs();
    const currentMsFromEl = el.currentTime * 1000;
    const videoMs = frameMs ?? currentMsFromEl;
    setMarks([...marks(), { id: generateMarkId(), videoMs, sync }]);
  };

  const removeMark = (id: string): void => {
    setMarks(marks().filter((m) => m.id !== id));
    const next: Record<number, string> = {};
    for (const [k, v] of Object.entries(eventToMark())) {
      if (v !== id) next[Number(k)] = v;
    }
    setEventToMark(next);
  };

  const updateMarkVideoMs = (id: string, videoMs: number): void => {
    setMarks(marks().map((m) => (m.id === id ? { ...m, videoMs } : m)));
  };

  const assignMarkToEvent = (
    eventIndex: number,
    markId: string | null,
  ): void => {
    const next: Record<number, string> = {};
    for (const [k, v] of Object.entries(eventToMark())) {
      const ki = Number(k);
      if (ki === eventIndex) continue;
      if (markId !== null && v === markId) continue;
      next[ki] = v;
    }
    if (markId !== null) next[eventIndex] = markId;
    setEventToMark(next);
  };

  const createMarkAndAssignToEvent = (eventIndex: number): void => {
    if (!isSynced()) return;
    const videoMs = testMsToVideoMs(currentMs());
    const id = generateMarkId();
    setMarks([...marks(), { id, videoMs }]);
    assignMarkToEvent(eventIndex, id);
  };

  const createSyncMarkAndAssignToEvent = (
    eventIndex: number,
    sync: SyncKind,
  ): void => {
    if (marks().some((m) => m.sync === sync)) return;
    const el = videoEl();
    if (el === undefined) return;
    const frameMs = videoFrameTimeMs();
    const currentMsFromEl = el.currentTime * 1000;
    const videoMs = frameMs ?? currentMsFromEl;
    const id = generateMarkId();
    setMarks([...marks(), { id, videoMs, sync }]);
    assignMarkToEvent(eventIndex, id);
  };

  const [videoPlayState, setVideoPlayState] = createSignal(false);
  const [videoCurrentMs, setVideoCurrentMs] = createSignal(0);
  const [videoFrameTimeMs, setVideoFrameTimeMs] = createSignal<number | null>(
    null,
  );
  const [videoFps, setVideoFps] = createSignal<number>(30);
  const frameMs = (): number => 1000 / videoFps();
  const currentFrameIndex = (): number | null => {
    const t = videoFrameTimeMs();
    if (t === null) return null;
    return Math.round((t / 1000) * videoFps());
  };

  createEffect(() => {
    const el = videoEl();
    if (el === undefined) return;
    type Metadata = { mediaTime: number };
    type RVFCElement = HTMLVideoElement & {
      requestVideoFrameCallback?: (
        cb: (now: number, metadata: Metadata) => void,
      ) => number;
    };
    const rvfcEl = el as RVFCElement;
    if (typeof rvfcEl.requestVideoFrameCallback !== "function") return;
    let lastMt = -1;
    const samples: number[] = [];
    const cb = (_now: number, metadata: Metadata): void => {
      const mt = metadata.mediaTime;
      setVideoFrameTimeMs(mt * 1000);
      if (lastMt >= 0) {
        const dt = mt - lastMt;
        if (dt > 0 && dt < 0.1) {
          samples.push(1 / dt);
          if (samples.length > 30) samples.shift();
          const sorted = [...samples].sort((a, b) => a - b);
          const median = sorted[Math.floor(sorted.length / 2)];
          if (median !== undefined) setVideoFps(median);
        }
      }
      lastMt = mt;
      rvfcEl.requestVideoFrameCallback?.(cb);
    };
    rvfcEl.requestVideoFrameCallback(cb);
  });

  const seekVideoMs = (videoMs: number): void => {
    const el = videoEl();
    if (el === undefined) return;
    const dur = Number.isFinite(el.duration) ? el.duration : videoMs / 1000;
    el.currentTime = Math.max(0, Math.min(dur, videoMs / 1000));
  };

  const toggleVideoPlay = (): void => {
    const el = videoEl();
    if (el === undefined) return;
    if (el.paused) {
      void el.play().catch(() => undefined);
    } else {
      el.pause();
    }
  };

  const videoStepFrame = (delta: number): void => {
    const el = videoEl();
    if (el === undefined) return;
    el.pause();
    const t = el.currentTime + (delta * frameMs()) / 1000;
    el.currentTime = Math.max(
      0,
      Math.min(Number.isFinite(el.duration) ? el.duration : t, t),
    );
  };

  return (
    <div class="flex flex-col gap-3">
      {/* HEADER */}
      <div class="flex items-center justify-between gap-2">
        <Button
          variant="text"
          onClick={props.onBack}
          fa={{ icon: "fa-arrow-left" }}
          text="Back"
        />
        <Show when={isSynced()}>
          <div class="flex items-center gap-2 rounded bg-main px-3 py-1 text-xs font-bold tracking-wider text-bg uppercase">
            <span>● Synced</span>
            <span class="font-mono opacity-80">
              {videoMapping().slope.toFixed(4)}×
            </span>
          </div>
        </Show>
      </div>

      {/* VIDEO VIEWER PANEL */}
      <div class="bg-bg-secondary flex flex-col gap-2 rounded-lg p-3">
        <div class="flex items-center justify-between gap-2">
          <div class="text-xs tracking-wider text-sub uppercase">Viewer</div>
          <div class="flex items-center gap-2">
            <input
              type="file"
              accept="video/*"
              onChange={onPickVideo}
              class="text-xs text-text"
            />
            <Show when={videoUrl() !== null}>
              <Button
                variant="text"
                text="Clear"
                class="text-xs"
                onClick={clearVideo}
              />
            </Show>
          </div>
        </div>
        <Show
          when={videoUrl() !== null}
          fallback={
            <div class="flex h-64 items-center justify-center rounded bg-bg text-xs text-sub">
              No video loaded
            </div>
          }
        >
          <div class="flex justify-center">
            <video
              ref={(el) => setVideoEl(el)}
              src={videoUrl() ?? undefined}
              class="max-h-[60vh] w-full max-w-3xl rounded bg-bg object-contain"
              muted
              onLoadedMetadata={(e) =>
                setVideoDurationMs(e.currentTarget.duration * 1000)
              }
              onPlay={() => setVideoPlayState(true)}
              onPause={() => setVideoPlayState(false)}
              onTimeUpdate={(e) => {
                const ct = e.currentTarget.currentTime * 1000;
                setVideoCurrentMs(ct);
                if (isSynced()) setCurrentMs(videoMsToTestMs(ct));
              }}
            ></video>
          </div>
          <input
            type="range"
            min="0"
            max={videoDurationMs() ?? 0}
            step="1"
            value={videoCurrentMs()}
            onInput={(e) => seekVideoMs(Number(e.currentTarget.value))}
            class="w-full"
          />
          <div class="flex items-center justify-between gap-2">
            <div
              class="font-mono text-xs text-sub"
              title="current video frame index / time @ detected fps"
            >
              {currentFrameIndex() !== null
                ? `${currentFrameIndex()} (${(videoFrameTimeMs() ?? 0).toFixed(2)}ms @ ${videoFps().toFixed(2)}fps)`
                : "—"}
            </div>
            <div class="flex items-center gap-1">
              <Button
                variant="text"
                balloon={{ text: "Previous frame" }}
                fa={{ icon: "fa-step-backward" }}
                onClick={() => videoStepFrame(-1)}
              />
              <Button
                variant="button"
                balloon={{ text: videoPlayState() ? "Pause" : "Play" }}
                fa={{ icon: videoPlayState() ? "fa-pause" : "fa-play" }}
                onClick={toggleVideoPlay}
              />
              <Button
                variant="text"
                balloon={{ text: "Next frame" }}
                fa={{ icon: "fa-step-forward" }}
                onClick={() => videoStepFrame(1)}
              />
            </div>
            <Button
              variant="button"
              text={isSynced() ? "Synced" : "Sync"}
              active={isSynced()}
              disabled={!isSyncable()}
              balloon={{
                text: isSyncable()
                  ? isSynced()
                    ? "Click to unsync"
                    : "Lock video to timeline"
                  : "Both sync marks must be placed and assigned to events",
              }}
              onClick={toggleSync}
            />
          </div>
        </Show>
        <Show when={videoUrl() !== null}>
          <div class="flex flex-wrap items-center gap-2 border-t border-bg pt-2">
            <div class="text-xs tracking-wider text-sub uppercase">Marks</div>
            <Button
              variant="text"
              text="+ mark"
              class="text-xs"
              disabled={!isSynced()}
              balloon={{
                text: isSynced()
                  ? "Add a generic mark at the current video frame"
                  : "Add and assign both sync marks first",
              }}
              onClick={() => addMark()}
            />
            <Button
              variant="text"
              text="+ start sync"
              class="text-xs"
              disabled={syncStartMark() !== undefined}
              balloon={{
                text: "Add the start sync mark at the current video frame",
              }}
              onClick={() => addMark("start")}
            />
            <Button
              variant="text"
              text="+ end sync"
              class="text-xs"
              disabled={syncEndMark() !== undefined}
              balloon={{
                text: "Add the end sync mark at the current video frame",
              }}
              onClick={() => addMark("end")}
            />
            <Show
              when={
                marks().filter((m) => eventIndexForMark(m.id) === undefined)
                  .length > 0
              }
            >
              <For
                each={marks().filter(
                  (m) => eventIndexForMark(m.id) === undefined,
                )}
              >
                {(mark) => (
                  <div class="flex items-center gap-1 rounded bg-bg p-1 font-mono text-xs">
                    <span class="text-text">{mark.sync ?? mark.id}</span>
                    <input
                      type="number"
                      value={mark.videoMs}
                      onInput={(e) =>
                        updateMarkVideoMs(
                          mark.id,
                          Number(e.currentTarget.value),
                        )
                      }
                      class="bg-bg-secondary w-20 rounded p-1 text-text"
                    />
                    <button
                      type="button"
                      class="cursor-pointer px-1 text-error"
                      onClick={() => removeMark(mark.id)}
                      title="Remove mark"
                    >
                      ×
                    </button>
                  </div>
                )}
              </For>
            </Show>
          </div>
        </Show>
      </div>

      {/* TIMELINE PANEL */}
      <div class="bg-bg-secondary flex flex-col gap-2 rounded-lg p-3">
        <div class="flex items-center justify-between">
          <div class="text-xs tracking-wider text-sub uppercase">Timeline</div>
          <div class="font-mono text-xs text-sub">
            {currentMs().toFixed(2)} / {maxMs} ms
          </div>
        </div>
        <div class="flex items-center justify-center gap-1">
          <Button
            variant="text"
            balloon={{ text: "Go to start" }}
            fa={{ icon: "fa-fast-backward" }}
            onClick={goToStart}
          />
          <Button
            variant="text"
            balloon={{ text: "-10ms" }}
            fa={{ icon: "fa-backward" }}
            onClick={() => step(-10)}
          />
          <Button
            variant="text"
            balloon={{ text: "-1ms" }}
            fa={{ icon: "fa-chevron-left" }}
            onClick={() => step(-1)}
          />
          <Button
            variant="text"
            balloon={{ text: "Previous event" }}
            fa={{ icon: "fa-step-backward" }}
            onClick={goPrevEvent}
          />
          <Button
            variant="button"
            balloon={{ text: playing() ? "Pause" : "Play" }}
            fa={{ icon: playing() ? "fa-pause" : "fa-play" }}
            onClick={togglePlay}
          />
          <Button
            variant="text"
            balloon={{ text: "Next event" }}
            fa={{ icon: "fa-step-forward" }}
            onClick={goNextEvent}
          />
          <Button
            variant="text"
            balloon={{ text: "+1ms" }}
            fa={{ icon: "fa-chevron-right" }}
            onClick={() => step(1)}
          />
          <Button
            variant="text"
            balloon={{ text: "+10ms" }}
            fa={{ icon: "fa-forward" }}
            onClick={() => step(10)}
          />
          <Button
            variant="text"
            balloon={{ text: "Go to end" }}
            fa={{ icon: "fa-fast-forward" }}
            onClick={goToEnd}
          />
        </div>
        <Show when={driftData().length > 0}>
          <DriftChart
            data={driftData()}
            minMs={timelineMinMs()}
            maxMs={timelineMaxMs()}
          />
        </Show>
        <Timeline
          segments={timelineLanes().segments}
          totalHeight={timelineLanes().totalHeight}
          minMs={timelineMinMs()}
          maxMs={timelineMaxMs()}
          currentMs={currentMs()}
          onSeek={setCurrentMs}
          videoBar={videoBarRange()}
          marks={timelineMarks()}
        />
      </div>

      {/* INSPECTOR: simulated input */}
      <div class="bg-bg-secondary flex flex-col gap-2 rounded-lg p-3">
        <div class="text-xs tracking-wider text-sub uppercase">
          Simulated input
        </div>
        <div class="min-h-10 rounded bg-bg p-2 font-mono text-sm break-all whitespace-pre-wrap">
          {simulatedInput()}
        </div>
      </div>

      {/* INSPECTOR: words */}
      <div class="bg-bg-secondary flex flex-col gap-2 rounded-lg p-3">
        <div class="text-xs tracking-wider text-sub uppercase">Words</div>
        <div
          ref={(el) => (wordsScrollEl = el)}
          class="max-h-64 overflow-auto rounded bg-bg"
        >
          <table class="w-full text-xs">
            <thead class="sticky top-0 bg-bg">
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

      {/* INSPECTOR: events */}
      <div class="bg-bg-secondary flex flex-col gap-2 rounded-lg p-3">
        <div class="flex items-center justify-between gap-2">
          <div class="text-xs tracking-wider text-sub uppercase">
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
          class="max-h-96 overflow-auto rounded bg-bg"
        >
          <table class="w-full text-xs">
            <thead class="sticky top-0 bg-bg">
              <tr class="text-sub">
                <th class="w-24 p-2 text-right">time</th>
                <th class="w-24 p-2 text-left">type</th>
                <th class="w-32 p-2 text-left">mark</th>
                <th class="p-2 text-left">data</th>
              </tr>
            </thead>
            <tbody>
              <For each={filteredEventsWithIndex()}>
                {({ event, originalIndex }, i) => (
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
                    <td class="p-2">
                      <select
                        class="w-full rounded bg-bg p-1 font-mono text-xs text-text"
                        value={eventToMark()[originalIndex] ?? ""}
                        onChange={(e) => {
                          const v = e.currentTarget.value;
                          if (v === "") {
                            assignMarkToEvent(originalIndex, null);
                          } else if (v === "__new__") {
                            createMarkAndAssignToEvent(originalIndex);
                          } else if (v === "__new_start__") {
                            createSyncMarkAndAssignToEvent(
                              originalIndex,
                              "start",
                            );
                          } else if (v === "__new_end__") {
                            createSyncMarkAndAssignToEvent(
                              originalIndex,
                              "end",
                            );
                          } else {
                            assignMarkToEvent(originalIndex, v);
                          }
                          e.currentTarget.value =
                            eventToMark()[originalIndex] ?? "";
                        }}
                      >
                        <option value="">(none)</option>
                        <For
                          each={marks().filter((m) => {
                            const idx = eventIndexForMark(m.id);
                            return idx === undefined || idx === originalIndex;
                          })}
                        >
                          {(mark) => (
                            <option value={mark.id}>
                              {mark.sync ?? mark.id} ({mark.videoMs.toFixed(0)}
                              ms)
                            </option>
                          )}
                        </For>
                        <Show
                          when={
                            videoUrl() !== null && syncStartMark() === undefined
                          }
                        >
                          <option value="__new_start__">
                            + start sync mark @ frame
                          </option>
                        </Show>
                        <Show
                          when={
                            videoUrl() !== null && syncEndMark() === undefined
                          }
                        >
                          <option value="__new_end__">
                            + end sync mark @ frame
                          </option>
                        </Show>
                        <Show when={isSynced()}>
                          <option value="__new__">
                            + new mark at playhead
                          </option>
                        </Show>
                      </select>
                    </td>
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
  videoBar?: { start: number; end: number };
  marks?: { testMs: number; label: string; sync?: "start" | "end" }[];
}): JSXElement {
  const range = (): number => Math.max(props.maxMs - props.minMs, 1);
  const scale = (ms: number): number => ((ms - props.minMs) / range()) * 100;
  const dotSize = 4;
  const dotOffset = (TIMELINE_TRACK_HEIGHT - dotSize) / 2;
  const segmentYOffset = (): number =>
    props.videoBar !== undefined
      ? TIMELINE_TRACK_HEIGHT + TIMELINE_LANE_GAP
      : 0;
  const adjustedHeight = (): number => props.totalHeight + segmentYOffset();

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
          height: `${adjustedHeight()}px`,
          width: `${zoom() * 100}%`,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <Show when={props.videoBar}>
          {(bar) => (
            <div
              title="Video"
              class="absolute rounded-[2px] bg-sub-alt"
              style={{
                left: `${scale(bar().start)}%`,
                width: `max(${((bar().end - bar().start) / range()) * 100}%, 2px)`,
                top: "0px",
                height: `${TIMELINE_TRACK_HEIGHT}px`,
              }}
            ></div>
          )}
        </Show>
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
                    top: `${seg.topPx + segmentYOffset()}px`,
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
                  top: `${seg.topPx + dotOffset + segmentYOffset()}px`,
                }}
              ></div>
            );
          }}
        </For>
        <For each={props.marks ?? []}>
          {(mark) => (
            <div
              title={mark.label}
              class={cn(
                "absolute top-0 bottom-0 w-0.5",
                mark.sync !== undefined ? "bg-main" : "bg-text",
              )}
              style={{
                left: `${scale(mark.testMs)}%`,
                transform: "translateX(-50%)",
              }}
            ></div>
          )}
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

function DriftChart(props: {
  data: { eventTestMs: number; driftMs: number; label: string }[];
  minMs: number;
  maxMs: number;
}): JSXElement {
  const HEIGHT = 60;
  const range = (): number => Math.max(props.maxMs - props.minMs, 1);
  const xPct = (ms: number): number => ((ms - props.minMs) / range()) * 100;
  const yMaxAbs = (): number => {
    let max = 50;
    for (const p of props.data) {
      if (Math.abs(p.driftMs) > max) max = Math.abs(p.driftMs);
    }
    return Math.ceil(max);
  };
  const yPx = (drift: number): number =>
    HEIGHT / 2 - (drift / yMaxAbs()) * (HEIGHT / 2 - 4);

  return (
    <div class="bg-bg-secondary relative w-full overflow-hidden rounded">
      <div
        class="absolute top-0 right-0 px-1 font-mono text-xs text-sub"
        style={{ "line-height": "1" }}
      >
        +{yMaxAbs()}ms
      </div>
      <div
        class="absolute right-0 bottom-0 px-1 font-mono text-xs text-sub"
        style={{ "line-height": "1" }}
      >
        −{yMaxAbs()}ms
      </div>
      <div
        class="absolute left-1 px-1 font-mono text-xs text-sub"
        style={{ top: `${HEIGHT / 2 - 6}px`, "line-height": "1" }}
      >
        drift
      </div>
      <div class="relative w-full" style={{ height: `${HEIGHT}px` }}>
        <div
          class="absolute right-0 left-0 h-px bg-sub"
          style={{ top: `${HEIGHT / 2}px` }}
        ></div>
        <For each={props.data}>
          {(p) => (
            <div
              class="absolute rounded-full bg-main"
              title={`${p.label}: ${p.driftMs.toFixed(2)}ms @ test ${p.eventTestMs.toFixed(2)}ms`}
              style={{
                left: `calc(${xPct(p.eventTestMs)}% - 3px)`,
                top: `${yPx(p.driftMs) - 3}px`,
                width: "6px",
                height: "6px",
              }}
            ></div>
          )}
        </For>
      </div>
    </div>
  );
}
