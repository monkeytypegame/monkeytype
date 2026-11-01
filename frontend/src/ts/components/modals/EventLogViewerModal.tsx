import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  LineElement,
  PointElement,
  ScatterController,
  Tooltip,
} from "chart.js";
import chartAnnotation, {
  type AnnotationOptions,
} from "chartjs-plugin-annotation";
import {
  createDeferred,
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
  EventLog,
  InputEventNoMs,
  TestEventNoMs,
  TestEventType,
} from "../../test/events/types";

import {
  EVENT_TYPES,
  getCurrentMs,
  getDistributionOpen,
  getError,
  getEventLog,
  getEventToMark,
  getMarks,
  getRaw,
  getScatterOpen,
  getStage,
  getSyncEnabled,
  getTimelineZoom,
  getVideoUrl,
  getVisibleTypes,
  type Mark,
  nextMarkId,
  resetEventLogViewer,
  setCurrentMs,
  setDistributionOpen,
  setError,
  setEventLog,
  setEventToMark,
  setMarks,
  setRaw,
  setScatterOpen,
  setStage,
  setSyncEnabled,
  setTimelineZoom,
  setVideoFile,
  setVisibleTypes,
  type SyncKind,
} from "../../states/event-log-viewer";
import { hideModal } from "../../states/modals";
import { getLastEventLog } from "../../states/test";
import { getTheme } from "../../states/theme";
import { getInputFromDom } from "../../test/events/helpers";
import {
  getKeypressDurations,
  getKeypressSpacing,
} from "../../test/events/stats";
import {
  computeBellness,
  computeCrossStats,
  computeDistStats,
  probit,
  type QuantumFit,
  type Significant,
} from "../../test/events/timing-stats";
import { EVENT_LOG_VERSION } from "../../test/events/types";
import { cn } from "../../utils/cn";
import { AnimatedModal } from "../common/AnimatedModal";
import { Balloon } from "../common/Balloon";
import { Button } from "../common/Button";
import { ChartJs } from "../common/ChartJs";

// this modal is lazy loaded on its own, so it cannot rely on whatever else
// happens to have registered these. register is idempotent
Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  ScatterController,
  Tooltip,
  chartAnnotation,
);

const TIMELINE_TRACK_HEIGHT = 8;
const TIMELINE_TRACK_GAP = 2;
const TIMELINE_LANE_GAP = 6;
const TIMELINE_PADDING_MS = 125;
// enough to separate events a fraction of a millisecond apart - a 60s test at
// this zoom is roughly 0.06ms per pixel
const TIMELINE_MAX_ZOOM = 1000;

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
  events: TestEventNoMs[],
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

function parseContext(raw: string): EventLog {
  const parsed = JSON.parse(raw) as unknown;
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Expected an EventLog object");
  }
  if (
    !("version" in parsed) ||
    !("events" in parsed) ||
    !("context" in parsed)
  ) {
    throw new Error(
      `Expected EventLog { version: ${EVENT_LOG_VERSION}, events, context }`,
    );
  }
  if (parsed.version !== EVENT_LOG_VERSION) {
    throw new Error(
      `Unsupported EventLog version ${String(parsed.version)} (expected ${EVENT_LOG_VERSION})`,
    );
  }
  if (!Array.isArray((parsed as EventLog).events)) {
    throw new Error("EventLog.events must be an array");
  }
  const ctx = (parsed as EventLog).context as unknown;
  if (
    typeof ctx !== "object" ||
    ctx === null ||
    !Array.isArray((ctx as { targetWords?: unknown }).targetWords)
  ) {
    throw new Error("EventLog.context.targetWords must be a string array");
  }
  return parsed as EventLog;
}

function visualizeWhitespace(s: string): string {
  return s.replace(/ /g, "␣").replace(/\t/g, "→").replace(/\n/g, "↵");
}

function inputsPerWord(events: TestEventNoMs[], wordCount: number): string[] {
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

export function EventLogViewerModal(): JSXElement {
  const stage = getStage;
  const raw = getRaw;
  const ctx = getEventLog;
  const err = getError;

  const loadFrom = (json: string): void => {
    try {
      const parsed = parseContext(json);
      setEventLog(parsed);
      setError(null);
      setStage("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const onShow = (): void => loadFrom(raw());

  const onLoadLatest = (): void => {
    const log = getLastEventLog();
    if (log === null) {
      setError("No event log available - complete a test first");
      return;
    }
    const json = JSON.stringify(log);
    setRaw(json);
    loadFrom(json);
  };

  return (
    <AnimatedModal
      id="EventLogViewer"
      title="Event Log Viewer"
      modalClass="max-w-full h-full flex flex-col overflow-hidden"
      // deliberately no beforeShow reset. AnimatedModal re-runs its visibility
      // effect whenever it mounts, and a hot reload remounts it while the modal
      // store still says open - so a reset hook here wipes the loaded log on
      // every save, which is the exact thing the separate state module exists
      // to prevent. clearing is an explicit button instead
    >
      <Show when={stage() === "input"}>
        <div class="flex flex-col gap-4">
          <textarea
            class="bg-bg-secondary h-64 w-full rounded p-2 font-mono text-xs text-text"
            placeholder='{"version": 1, "events": [...], "context": {...}}'
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
              onClick={onLoadLatest}
              fa={{ icon: "fa-download" }}
              text="Load latest data"
              balloon={{ text: "Load the event log from the last test" }}
            />
            <Button
              variant="button"
              onClick={resetEventLogViewer}
              fa={{ icon: "fa-trash" }}
              text="Clear"
              balloon={{
                text: "Throw away the loaded log, marks and video. State is kept across closing the modal and across hot reloads, so this is the only thing that clears it.",
              }}
            />
            <Button
              variant="button"
              onClick={() => hideModal("EventLogViewer")}
              text="Cancel"
            />
            <Button variant="button" onClick={onShow} text="Show" />
          </div>
        </div>
      </Show>
      <Show when={stage() === "preview" && ctx() !== null}>
        <PreviewContent
          ctx={ctx() as EventLog}
          onBack={() => setStage("input")}
        />
      </Show>
    </AnimatedModal>
  );
}

function PreviewContent(props: {
  ctx: EventLog;
  onBack: () => void;
}): JSXElement {
  const maxMs = untrack(() =>
    Math.ceil(
      props.ctx.events.reduce((m, e) => (e.testMs > m ? e.testMs : m), 0),
    ),
  );
  const videoUrl = getVideoUrl;
  const [videoEl, setVideoEl] = createSignal<HTMLVideoElement | undefined>(
    undefined,
  );
  const [videoDurationMs, setVideoDurationMs] = createSignal<number | null>(
    null,
  );

  const marks = getMarks;
  // eventIndex (index into props.ctx.events) → mark id
  const eventToMark = getEventToMark;

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
  const syncEnabled = getSyncEnabled;
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
    const sE = syncStartEvent() as TestEventNoMs;
    const eE = syncEndEvent() as TestEventNoMs;
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

  const currentMs = getCurrentMs;

  const visibleEvents = createMemo(() =>
    props.ctx.events.filter((e) => e.testMs <= currentMs()),
  );

  // the stats panels read this rather than the full log, so scrubbing the
  // timeline rebuilds them from only what has happened so far. deferred because
  // recomputing them - the quantum sweep above all - on every animation frame
  // would make playback crawl; solid drops the intermediate values and settles
  // on the latest once the playhead stops moving
  const visibleLog = createMemo((): EventLog => ({
    ...props.ctx,
    events: visibleEvents(),
  }));
  const statsLog = createDeferred(visibleLog, { timeoutMs: 250 });

  const finalInputs = untrack(() =>
    inputsPerWord(props.ctx.events, props.ctx.context.targetWords.length),
  );

  const liveInputs = createMemo(() =>
    inputsPerWord(visibleEvents(), props.ctx.context.targetWords.length),
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

  const visibleTypes = getVisibleTypes;

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
      const ms = (events[i] as TestEventNoMs).testMs;
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
    setVideoFile(file);
  };

  const clearVideo = (): void => {
    setVideoFile(null);
    setVideoDurationMs(null);
  };

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
    setMarks([...marks(), { id: nextMarkId(), videoMs, sync }]);
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
    const id = nextMarkId();
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
    const id = nextMarkId();
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
    <div class="flex min-h-0 flex-1 flex-col gap-3">
      {/* HEADER */}
      <div class="flex shrink-0 items-center justify-between gap-2">
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

      {/* SIDE-BY-SIDE: video | words | events */}
      <div class="flex min-h-0 flex-1 gap-3">
        {/* VIDEO VIEWER PANEL */}
        <div class="bg-bg-secondary flex min-h-0 w-0 flex-1 flex-col gap-2 overflow-auto rounded-lg p-3">
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

        {/* INSPECTOR: words */}
        <div class="bg-bg-secondary flex min-h-0 w-0 flex-1 flex-col gap-2 rounded-lg p-3">
          <div class="text-xs tracking-wider text-sub uppercase">Words</div>
          <div
            ref={(el) => (wordsScrollEl = el)}
            class="min-h-0 flex-1 overflow-auto rounded bg-bg"
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
                <For each={props.ctx.context.targetWords}>
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
        <div class="bg-bg-secondary flex min-h-0 w-0 flex-[1.5] flex-col gap-2 rounded-lg p-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
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
            class="min-h-0 flex-1 overflow-auto rounded bg-bg"
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
                                {mark.sync ?? mark.id} (
                                {mark.videoMs.toFixed(0)}
                                ms)
                              </option>
                            )}
                          </For>
                          <Show
                            when={
                              videoUrl() !== null &&
                              syncStartMark() === undefined
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

      {/* INSPECTOR: simulated input */}
      <div class="bg-bg-secondary flex shrink-0 flex-col gap-2 rounded-lg p-3">
        <div class="text-xs tracking-wider text-sub uppercase">
          Simulated input
        </div>
        <div class="max-h-24 min-h-10 overflow-auto rounded bg-bg p-2 font-mono text-sm break-all whitespace-pre-wrap">
          {simulatedInput()}
        </div>
      </div>

      {/* KEY TIMING DISTRIBUTION PANEL */}
      <DistributionPanel ctx={statsLog()} fullCtx={props.ctx} />

      {/* KEY TIMING SCATTER PANEL */}
      <ScatterPanel ctx={statsLog()} fullCtx={props.ctx} />

      {/* TIMELINE PANEL */}
      <div class="bg-bg-secondary flex shrink-0 flex-col gap-2 rounded-lg p-3">
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

  const zoom = getTimelineZoom;
  const setZoom = setTimelineZoom;
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
    const newZoom = Math.max(1, Math.min(TIMELINE_MAX_ZOOM, oldZoom * factor));
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

const HISTOGRAM_HEIGHT = 160;

type MetricKind = "spacing" | "duration";

const STAT_DEFINITIONS = {
  n: "Sample size. Shape estimates get noisy below roughly 100 values, so a short test is much weaker evidence than a long one.",
  percentiles:
    "The 10th, 50th (median) and 90th percentiles - the three markers drawn on the chart. The median is the typical value; the gap up to p90 is the tail.",
  mean: "Arithmetic average. Sits above the median when the data is right skewed, so a large mean-median gap is itself a sign of a long tail.",
  sd: "Standard deviation - absolute spread, in ms.",
  cv: "Coefficient of variation (sd/mean) - spread relative to speed. Careful: sd is dominated by pauses, so a generator with realistic pauses bolted onto unrealistically tight typing scores the same cv as a human. Trust the lo and hi halves over this.",
  spreadLow:
    "(p50-p10)/p50 - how wide the fast half of the body is, relative to the median. Built only from percentiles, so no pause can touch it, and relative so it compares across any typing speed. Kept separate from the slow half on purpose: a log that is generated for most of a test and typed for the rest has a normal looking total spread, because the real typing stretches the slow half while the generated part keeps this one pinched.",
  spreadHigh:
    "(p90-p50)/p50 - the same measure for the slow half. Mostly reflects how much the typist paused. Reading it against the fast half gives the asymmetry of the body, but that ratio is not worth thresholding: real tests land on both sides of 1 - a fast typist rolling keys measures 0.92 - and a real generator measured 1.24, so it points the wrong way.",
  acf1: "Lag-1 autocorrelation: does a slow keystroke tend to be followed by another slow one? Runs -1 to +1, computed on the logs so one long pause cannot dominate it. This is the only stat here that is not order invariant - shuffle the array and every other number on this row is unchanged while this one moves. Humans wander in runs: faster through a familiar word, slower through an awkward one, slower when tired. A generator drawing each gap fresh has no memory at all and sits at 0 by construction. The sigma figure is how far from zero that is under the independence null, whose standard error is exactly 1/sqrt(n) - so unlike every other threshold here, the generator side is exact arithmetic rather than fitted to a couple of samples.",
  runs: "Wald-Wolfowitz runs test: how many times the series crosses its own median, against how many times chance alone would. Reported as a z. Negative means fewer crossings than chance - the values clump into slow and fast patches, which is what momentum looks like. Zero means each value is independent of its neighbours. Like the autocorrelation the null here is exact, so the z is a real significance rather than a fitted threshold, and it catches clumping that lag-1 correlation can miss.",
  drift:
    "Median of the last third of the test divided by the median of the first third. People drift - warming up, tiring, settling into a rhythm - so a value sitting exactly on 1.00 means nothing changed across the whole test, which is what a generator is by construction. Above 1 means slowing down, below 1 means speeding up.",
  quantum:
    "The grid the values sit on, and how tightly, found by sweeping every period from 0.5ms to 30ms rather than testing a list of guesses. The number in brackets runs 0 to 1: under about 0.3 there is no grid and this reads as a dash, near 1 every value lands on one. Causes are both innocent and not - a 125Hz USB keyboard polls every 8ms, a display can align input to its refresh at 6.94ms or 16.67ms, and a setInterval bot lands on 10ms. Same periods either way.",
  distinct:
    "How many different values appear at all. Real timings come from subtracting two clock readings, so they are nearly all unique even after browser coarsening. A generator drawing from a small hardcoded pool gives a tiny count, and this catches it even when the pool sits on no regular grid.",
  bell: "How close the distribution is to a bell, as the correlation between the sorted values and the quantiles a normal would have put them at - a number for what the q-q chart below draws. 1.00 is exactly bell shaped. Spacing is measured on its logs, since gaps between keys are multiplicative and land near lognormal; hold times are measured as they are. This replaced excess kurtosis, which is a statement about tail weight rather than shape: a couple of surviving outliers sent one generated log to +119 while its body was a fixed interval, and real humans measured on both sides of zero, so there was no human direction left to flag.",
  skew: "Third moment - asymmetry. Driven largely by the pause tail, which is exactly why it works: a generator that never stops to think has nothing to make it positive.",
} as const;

// rough reference ranges, meant for eyeballing a trace in this viewer rather
// than as thresholds
const STAT_EXAMPLES: Record<
  MetricKind,
  Record<keyof typeof STAT_DEFINITIONS, string>
> = {
  spacing: {
    n: "A 60s test at 100wpm gives around 500 intervals, a 15s test around 125.",
    percentiles:
      "Human median is roughly 12000/wpm ms - about 120ms at 100wpm, 60ms at 200wpm. A fixed interval generator puts all three on the same number.",
    mean: "Human: noticeably above the median, since pauses pull it up. Generated: mean and median nearly identical.",
    sd: "Human: comparable to the median, often 50-150ms. Fixed interval: 0. Jitter generators usually land 10-40ms.",
    cv: "Human: roughly 0.4-0.8, but a tight generator with pauses added measures 1.37 against a human's 1.36 - indistinguishable.",
    spreadLow:
      "Human: 0.43 and 0.49 on real tests, 0.35 to 0.55 simulated. A generator typing too consistently measures 0.15, and a log that is 70% generated still only reaches 0.20 even though its total spread looks wider than a human's.",
    spreadHigh:
      "Human: 0.45 to 0.71 on real tests, and much higher for anyone who pauses a lot. Not flagged.",
    runs: "Expect a clearly negative z from a hand and about 0 from a generator. No real measurements yet.",
    drift:
      "Expect a hand to land some way off 1.00 in either direction over a full test. A generator sits on it.",
    acf1: "No real measurements yet - this is here to gather them. Expect a generator near 0. Our own cheat typer draws every gap independently, so it should sit at 0 too despite passing every other stat on this row.",
    quantum:
      "Vertical banding in the hold vs flight scatter is this showing up visually. Check whether keyDuration reports the same period: a quantised clock reaches every difference, so if only spacing is banded the cause sits in how keydowns are scheduled rather than in the clock.",
    distinct:
      "Human: hundreds - roughly 850 of 900 on a fine clock, and still about 120 on firefox's coarser 1ms. A pool based generator gives a dozen.",
    bell: "Measured on a labelled corpus rather than simulated. Human: 0.9417 to 0.9849 across five logs from 122 to 202wpm. Every generated log in that corpus came in below 0.9235, including one built to look human on purpose. The two ends do not overlap, which no other single stat here manages.",
    skew: "Human: strongly positive, often 2+ once pauses are included. Uniform or gaussian generator: about 0.",
  },
  duration: {
    n: "One value per keypress, minus any key that was never released.",
    percentiles:
      "Human hold times are roughly 60-120ms and vary far less with speed than spacing does. Synthetic traces often reuse one constant hold.",
    mean: "Human: close to the median, hold times have a much shorter tail than spacing. Generated: identical to the median.",
    sd: "Human: roughly 15-40ms. A constant hold gives 0.",
    cv: "Human: roughly 0.2-0.4. A constant hold gives ~0.",
    runs: "Same reading as for spacing. No real measurements yet.",
    drift:
      "Hold times drift with fatigue too, though probably less than spacing does.",
    acf1: "Hold times should carry momentum for the same reason spacing does - the same hand is speeding up and slowing down - but nobody has measured it. Gathering numbers.",
    quantum:
      "Worth comparing against the spacing reading. Both banded on the same period means the clock or timer is quantised globally; only spacing banded points at keydown scheduling - polling or frame alignment - instead.",
    distinct:
      "Hold times cover a narrower range than spacing, so expect fewer distinct values, but still well into the hundreds on a fine clock.",
    spreadLow:
      "Human: 0.23 and 0.36 on real tests. A generator holding every key for near enough the same time measures 0.12. Tighter margin than the spacing version, so treat a lone flag here as weaker evidence.",
    spreadHigh: "Human: 0.35 to 0.39 on real tests. Not flagged.",
    bell: "Human: 0.8627 to 0.9783 measured. Weaker than the spacing version and it points both ways - a generator drawing holds from a clean lognormal overshoots to 0.9952, straighter than any real hand, so a low reading here is evidence while a very high one is its own kind of odd.",
    skew: "Human: mildly positive. Symmetric generator: about 0.",
  },
};

/**
 * Every one of these flags a value that is too LOW. All the shape stats point
 * the same way: generators sit below humans on all of them, and nothing above
 * the human range is suspicious - a long tail is just someone thinking.
 *
 * Numbers set between the worst human case and the best generator case on a
 * labelled corpus of ten logs, except where noted as simulated. cv and the median only catch
 * fixed intervals and impossible speeds; the real separation is spreadLow and
 * bell, which fail on different logs and so catch different generators.
 */
type SuspicionLimits = {
  cv: number;
  spreadLow: number;
  /** flagged when fewer distinct values than this appear */
  distinct: number;
  bell: number;
  skew: number;
  /** median in ms - below this the typing is not physically possible */
  median: number;
};

// tail and sigma are deliberately not in here. they only look at p10..p90, and
// a fast typist rolls enough keys that the body of their distribution goes
// symmetric or even left leaning - real data at ~200wpm measures tail 0.92,
// lower than any generator tested, so thresholding it would flag humans
// preferentially. the pause tail the ratio ignores by design is the strongest
// human signal there is, and skew is the stat that sees it
const SUSPICIOUS: Record<MetricKind, SuspicionLimits> = {
  spacing: {
    cv: 0.15,
    spreadLow: 0.3,
    distinct: 30,
    bell: 0.93,
    skew: 0.5,
    median: 30,
  },
  duration: {
    cv: 0.1,
    spreadLow: 0.18,
    distinct: 30,
    bell: 0.85,
    skew: 0.3,
    median: 20,
  },
};

// below this the shape stats are too noisy to accuse anyone with
const MIN_SAMPLE_FOR_FLAGS = 100;

function statBalloon(
  stat: keyof typeof STAT_DEFINITIONS,
  kind: MetricKind,
): string {
  return `${STAT_DEFINITIONS[stat]} ${STAT_EXAMPLES[kind][stat]}${flagNote(stat, kind)}`;
}

function flagNote(
  stat: keyof typeof STAT_DEFINITIONS,
  kind: MetricKind,
): string {
  const limits = SUSPICIOUS[kind];
  switch (stat) {
    case "cv":
      return ` Flagged red below ${limits.cv}.`;
    case "spreadLow":
      return ` Flagged red below ${limits.spreadLow}.`;
    case "spreadHigh":
      return " Not flagged. A short test with no pauses legitimately has very little upper half, and a generator that never stops to think is already caught by skew.";
    case "runs":
    case "drift":
      return " Not flagged. Gathering numbers first.";
    case "acf1":
      return " Not flagged. The generator side of this test is exact, but whether real typists reliably sit well above zero has not been measured yet - so it reports until there are numbers to set a threshold from.";
    case "quantum":
      return " Not flagged. A 125Hz USB keyboard polls every 8ms and a display can align input to its refresh, so legitimate hardware puts real typing on exactly the kind of grid a timer driven bot would - same period, opposite verdict. Reported so it can be read, not acted on.";
    case "distinct":
      return ` Flagged red below ${limits.distinct} distinct values.`;
    case "bell":
      return ` Flagged red below ${limits.bell}, set between the lowest human and the highest generated log measured so far. Five human logs is not many, and all of them come from a handful of machines - treat a lone flag here as a reason to look, not a verdict.`;
    case "skew":
      return ` Flagged red below ${limits.skew}.`;
    case "percentiles":
      return ` Flagged red when the median is under ${limits.median}ms.`;
    case "n":
      return ` Under ${MIN_SAMPLE_FOR_FLAGS} samples the shape stats are too noisy to accuse anyone with, so nothing is flagged and this number turns amber instead.`;
    default:
      return "";
  }
}

type BucketSpec = {
  /** lower edge of each bucket. the last one is open ended */
  edges: number[];
  axisTitle: string;
  /** divide every value by the median before bucketing */
  relativeToMedian: boolean;
};

/**
 * Fixed buckets, so histograms are directly comparable between event logs.
 * Spacing is bucketed as a multiple of its own median because the gap between
 * keys scales with typing speed - 12000/wpm ms - so absolute edges would put a
 * fast typist and a slow one in completely different buckets. Hold times do not
 * scale that way, they sit around 60-120ms whoever is typing, so duration uses
 * absolute milliseconds where the boundaries are physical.
 */
const BUCKETS: Record<MetricKind, BucketSpec> = {
  spacing: {
    edges: [
      0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4,
      1.5, 1.6, 1.7, 1.8, 1.9, 2, 3,
    ],
    axisTitle: "× median",
    relativeToMedian: true,
  },
  duration: {
    edges: [
      0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160,
      170, 180, 190, 200,
    ],
    axisTitle: "ms",
    relativeToMedian: false,
  },
};

function bucketLabels(spec: BucketSpec): string[] {
  return spec.edges.map((edge, i) =>
    i === spec.edges.length - 1 ? `${edge}+` : `${edge}`,
  );
}

function bucketRangeLabel(spec: BucketSpec, index: number): string {
  const lower = spec.edges[index] as number;
  const upper = spec.edges[index + 1];
  const unit = spec.relativeToMedian ? "× median" : "ms";
  if (upper === undefined) return `${lower}${unit} and over`;
  return `${lower} - ${upper}${unit}`;
}

function bucketRangeMs(
  spec: BucketSpec,
  index: number,
  medianMs: number,
): string {
  const lower = (spec.edges[index] as number) * medianMs;
  const upper = spec.edges[index + 1];
  if (upper === undefined) return `${lower.toFixed(0)}ms and over`;
  return `${lower.toFixed(0)} - ${(upper * medianMs).toFixed(0)}ms`;
}

function bucketIndex(spec: BucketSpec, value: number): number {
  for (let i = spec.edges.length - 1; i >= 0; i--) {
    if (value >= (spec.edges[i] as number)) return i;
  }
  return 0;
}

/**
 * Position on the category axis for an exact value, interpolated inside its
 * bucket so the percentile markers do not just snap to bucket centres. Category
 * i spans i-0.5 to i+0.5 in index space.
 */
function categoryPosition(spec: BucketSpec, value: number): number {
  const index = bucketIndex(spec, value);
  const lower = spec.edges[index] as number;
  const upper = spec.edges[index + 1];
  if (upper === undefined) return index;
  const fraction = upper > lower ? (value - lower) / (upper - lower) : 0.5;
  return index - 0.5 + fraction;
}

function DistributionPanel(props: {
  ctx: EventLog;
  /** the whole log - only used to pin the bucket scale so it holds still */
  fullCtx: EventLog;
}): JSXElement {
  const spacing = createMemo(() => getKeypressSpacing(props.ctx));
  // durations are seeded with a 0 placeholder on keydown and filled in on
  // keyup, so a leftover 0 means the key was never released. mid playback that
  // also covers the key currently being held
  const durationsRaw = createMemo(() => getKeypressDurations(props.ctx));
  const unreleased = (): number => durationsRaw().filter((d) => d === 0).length;
  const durations = createMemo(() => durationsRaw().filter((d) => d > 0));

  const allSpacing = createMemo(() => getKeypressSpacing(props.fullCtx));
  const allDurations = createMemo(() =>
    getKeypressDurations(props.fullCtx).filter((d) => d > 0),
  );

  // these need both arrays at once, so they sit under the two charts rather
  // than inside either. durationsRaw keeps its 0 placeholders here on purpose -
  // dropping them would shift every later index out of alignment with spacing
  const cross = createMemo(() => computeCrossStats(spacing(), durationsRaw()));

  const open = getDistributionOpen;
  const setOpen = setDistributionOpen;

  return (
    <div class="bg-bg-secondary flex shrink-0 flex-col gap-2 rounded-lg p-3">
      <div class="flex items-center justify-between">
        <Balloon
          class="cursor-help text-xs tracking-wider text-sub uppercase"
          text="Hover any stat for what it measures and what human versus generated data looks like. Red means the value sits below the human range and is worth a look; amber on n means the sample is too small to flag anything. Every threshold is one sided - nothing above the human range is suspicious, a long tail is just someone thinking."
          position="up"
          length="xlarge"
          break
        >
          Key timing distribution
        </Balloon>
        <Button
          variant="text"
          fa={{ icon: open() ? "fa-chevron-up" : "fa-chevron-down" }}
          balloon={{ text: open() ? "Collapse" : "Expand" }}
          onClick={() => setOpen(!open())}
        />
      </div>
      <Show when={open()}>
        <div class="flex flex-wrap gap-3">
          <DistributionChart
            label="keySpacing"
            kind="spacing"
            values={spacing()}
            scaleValues={allSpacing()}
          />
          <DistributionChart
            label="keyDuration"
            kind="duration"
            values={durations()}
            scaleValues={allDurations()}
            note={
              unreleased() > 0
                ? `${unreleased()} unreleased excluded`
                : undefined
            }
          />
        </div>
        <div class="flex flex-wrap gap-x-3 gap-y-1 border-t border-bg pt-2 font-mono text-xs">
          <span class="text-sub">keySpacing × keyDuration</span>
          <Stat
            label="xcorr0"
            value={
              cross().lag0 === null
                ? "-"
                : `${(cross().lag0 as Significant).r.toFixed(2)} (${(cross().lag0 as Significant).sigmas.toFixed(1)}σ)`
            }
            balloon="Correlation between how long a key was held and the gap that followed it, on logs. The two arrays are index aligned - duration[i] and spacing[i] describe the same keypress - so one shared speed state in a hand should couple them. A generator drawing the two arrays from separate distributions sits at zero. Not flagged: the generator side is exact but nobody has measured the human side yet."
          />
          <Stat
            label="xcorr1"
            value={
              cross().lag1 === null
                ? "-"
                : `${(cross().lag1 as Significant).r.toFixed(2)} (${(cross().lag1 as Significant).sigmas.toFixed(1)}σ)`
            }
            balloon="The same correlation shifted by one key: the gap before a key against that key's hold. This is the part that is awkward to fake. Matching a single correlation is easy; being non zero at several lags at once needs the two series to actually come from one process rather than two."
          />
          <Stat
            label="overlap"
            value={
              cross().overlapRate === null
                ? "-"
                : `${((cross().overlapRate as number) * 100).toFixed(0)}%`
            }
            balloon="Share of keypresses still held when the next key went down - genuine rollover, derived from duration[i] > spacing[i]. Rollover is not optional at speed: gaps shrink as 12000/wpm while holds stay near 70ms, so most keystrokes must overlap at 200wpm and almost none at 60wpm. A fast result with no overlap describes a physically impossible hand."
          />
          <Stat
            label="ovl runs"
            value={
              cross().overlapRunsZ === null
                ? "-"
                : `${(cross().overlapRunsZ as number).toFixed(1)}σ`
            }
            balloon="Runs test on that overlap series. Rolling comes in bursts - through a familiar sequence you roll, elsewhere you do not - so the binary series should clump, giving a negative z. A generator whose holds and gaps are independent produces overlaps at random and sits near zero. Being binary this gets the exact runs test null for free."
          />
        </div>
      </Show>
    </div>
  );
}

function DistributionChart(props: {
  label: string;
  kind: MetricKind;
  values: number[];
  /** the whole log's values, used only to fix the bucket scale */
  scaleValues: number[];
  note?: string;
}): JSXElement {
  const stats = createMemo(() => computeDistStats(props.values));

  const spec = (): BucketSpec => BUCKETS[props.kind];

  // spacing buckets are multiples of the median, so every value is scaled by it
  // before being bucketed. taken from the whole log rather than what is
  // currently visible, so the buckets do not slide around underneath the bars
  // while the timeline plays
  const divisor = createMemo(() => {
    if (!spec().relativeToMedian) return 1;
    const scale = computeDistStats(props.scaleValues);
    return scale !== null && scale.p50 > 0 ? scale.p50 : 1;
  });

  const histogram = createMemo(() => {
    const bucketSpec = spec();
    const scale = divisor();
    const bins = new Array<number>(bucketSpec.edges.length).fill(0);
    for (const value of props.values) {
      const index = bucketIndex(bucketSpec, value / scale);
      bins[index] = (bins[index] as number) + 1;
    }
    const cumulative: number[] = [];
    let running = 0;
    for (const count of bins) {
      running += count;
      cumulative.push(running);
    }
    return { bins, cumulative, total: props.values.length };
  });

  // gaps between keys are multiplicative so the bell is expected on their
  // logs, hold times are already on the scale they are symmetric on
  const bell = createMemo(() =>
    computeBellness(props.values, props.kind === "spacing"),
  );

  const limits = (): SuspicionLimits => SUSPICIOUS[props.kind];

  // a small sample makes every shape number noisy, so hold the flags rather
  // than accuse someone on 40 keystrokes
  const isLow = (value: number | null, limit: number): boolean =>
    value !== null &&
    (stats()?.n ?? 0) >= MIN_SAMPLE_FOR_FLAGS &&
    value < limit;

  const chartData = createMemo(() => ({
    labels: bucketLabels(spec()),
    datasets: [
      {
        label: props.label,
        data: histogram().bins,
        backgroundColor: getTheme().main,
        borderColor: getTheme().main,
        barPercentage: 1,
        categoryPercentage: 1,
      },
    ],
  }));

  const percentileAnnotations = createMemo(() => {
    const s = stats();
    if (s === null) return {};
    const theme = getTheme();
    const line = (
      value: number,
      label: string,
      color: string,
    ): AnnotationOptions => ({
      type: "line",
      xMin: categoryPosition(spec(), value / divisor()),
      xMax: categoryPosition(spec(), value / divisor()),
      borderColor: color,
      borderWidth: 1,
      label: {
        display: true,
        content: label,
        position: "start",
        backgroundColor: theme.bg,
        color: theme.sub,
        font: { size: 9 },
        padding: 2,
      },
    });
    return {
      p10: line(s.p10, "p10", theme.sub),
      p50: line(s.p50, "p50", theme.text),
      p90: line(s.p90, "p90", theme.sub),
    };
  });

  return (
    <div class="flex min-w-80 flex-1 flex-col gap-1">
      <div class="flex items-baseline justify-between gap-2">
        <div class="font-mono text-xs text-text">{props.label}</div>
        <Show when={props.note}>
          <div class="text-xs text-sub">{props.note}</div>
        </Show>
      </div>
      <Show
        when={stats()}
        fallback={
          <div
            class="flex items-center justify-center rounded bg-bg text-xs text-sub"
            style={{ height: `${HISTOGRAM_HEIGHT}px` }}
          >
            No data
          </div>
        }
      >
        {(s) => (
          <>
            <div style={{ height: `${HISTOGRAM_HEIGHT}px` }}>
              <ChartJs
                name={`${props.label}-distribution`}
                type="bar"
                data={chartData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      type: "category",
                      title: { display: true, text: spec().axisTitle },
                      grid: { offset: false },
                      // every bucket keeps its label, including empty ones -
                      // an empty bucket is itself a finding
                      ticks: {
                        autoSkip: false,
                        maxRotation: 0,
                        minRotation: 0,
                      },
                    },
                    y: {
                      beginAtZero: true,
                      title: { display: true, text: "count" },
                      ticks: { precision: 0, maxTicksLimit: 5 },
                    },
                  },
                  plugins: {
                    legend: { display: false },
                    annotation: { annotations: percentileAnnotations() },
                    tooltip: {
                      displayColors: false,
                      callbacks: {
                        title: (items) => {
                          const index = items[0]?.dataIndex;
                          if (index === undefined) return "";
                          return bucketRangeLabel(spec(), index);
                        },
                        label: (item) => {
                          const h = histogram();
                          const count = h.bins[item.dataIndex] ?? 0;
                          const cumulative = h.cumulative[item.dataIndex] ?? 0;
                          const pct = h.total > 0 ? (count / h.total) * 100 : 0;
                          const cumulativePct =
                            h.total > 0 ? (cumulative / h.total) * 100 : 0;
                          const lines = [
                            `${count} of ${h.total} (${pct.toFixed(1)}%)`,
                            `cumulative ${cumulativePct.toFixed(1)}%`,
                          ];
                          if (spec().relativeToMedian) {
                            lines.unshift(
                              `median ${s().p50.toFixed(1)}ms, so ${bucketRangeMs(spec(), item.dataIndex, divisor())}`,
                            );
                          }
                          return lines;
                        },
                      },
                    },
                  },
                }}
              />
            </div>
            <div class="flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs">
              <Stat
                label="n"
                value={String(s().n)}
                balloon={statBalloon("n", props.kind)}
                warn={s().n < MIN_SAMPLE_FOR_FLAGS}
              />
              <Stat
                label="p10/50/90"
                value={`${s().p10.toFixed(1)}/${s().p50.toFixed(1)}/${s().p90.toFixed(1)}ms`}
                balloon={statBalloon("percentiles", props.kind)}
                bad={isLow(s().p50, limits().median)}
              />
              <Stat
                label="max"
                value={`${s().max.toFixed(0)}ms`}
                balloon="Largest value in the sample. The last bucket is open ended, so this is the only place an extreme outlier shows up - a long pause, or a key that was held down while the typist did something else."
              />
              <Stat
                label="mean"
                value={`${s().mean.toFixed(1)}ms`}
                balloon={statBalloon("mean", props.kind)}
              />
              <Stat
                label="sd"
                value={`${s().sd.toFixed(1)}ms`}
                balloon={statBalloon("sd", props.kind)}
              />
              <Stat
                label="cv"
                value={s().cv.toFixed(2)}
                balloon={statBalloon("cv", props.kind)}
                bad={isLow(s().cv, limits().cv)}
              />
              <Stat
                label="lo"
                value={s().spreadLow?.toFixed(2) ?? "-"}
                balloon={statBalloon("spreadLow", props.kind)}
                bad={isLow(s().spreadLow, limits().spreadLow)}
              />
              <Stat
                label="hi"
                value={s().spreadHigh?.toFixed(2) ?? "-"}
                balloon={statBalloon("spreadHigh", props.kind)}
              />
              <Stat
                label="acf1"
                value={
                  s().autocorrelation === null
                    ? "-"
                    : `${(s().autocorrelation as { r: number; sigmas: number }).r.toFixed(2)} (${(s().autocorrelation as { r: number; sigmas: number }).sigmas.toFixed(1)}σ)`
                }
                balloon={statBalloon("acf1", props.kind)}
              />
              <Stat
                label="runs"
                value={
                  s().runsZ === null
                    ? "-"
                    : `${(s().runsZ as number).toFixed(1)}σ`
                }
                balloon={statBalloon("runs", props.kind)}
              />
              <Stat
                label="drift"
                value={s().drift?.toFixed(2) ?? "-"}
                balloon={statBalloon("drift", props.kind)}
              />
              <Stat
                label="quantum"
                value={
                  s().quantum === null
                    ? "-"
                    : `${(s().quantum as NonNullable<QuantumFit>).periodMs.toFixed(2)}ms (${(s().quantum as NonNullable<QuantumFit>).strength.toFixed(2)})`
                }
                balloon={statBalloon("quantum", props.kind)}
              />
              <Stat
                label="distinct"
                value={String(s().distinctCount)}
                balloon={statBalloon("distinct", props.kind)}
                bad={isLow(s().distinctCount, limits().distinct)}
              />
              <Stat
                label="bell"
                value={bell()?.toFixed(3) ?? "-"}
                balloon={statBalloon("bell", props.kind)}
                bad={isLow(bell(), limits().bell)}
              />
              <Stat
                label="skew"
                value={s().skew.toFixed(2)}
                balloon={statBalloon("skew", props.kind)}
                bad={isLow(s().skew, limits().skew)}
              />
            </div>
          </>
        )}
      </Show>
    </div>
  );
}

const SCATTER_HEIGHT = 170;

const KEY_ORDER = [
  "Backquote",
  "Digit1",
  "Digit2",
  "Digit3",
  "Digit4",
  "Digit5",
  "Digit6",
  "Digit7",
  "Digit8",
  "Digit9",
  "Digit0",
  "Minus",
  "Equal",
  "Tab",
  "KeyQ",
  "KeyW",
  "KeyE",
  "KeyR",
  "KeyT",
  "KeyY",
  "KeyU",
  "KeyI",
  "KeyO",
  "KeyP",
  "BracketLeft",
  "BracketRight",
  "Backslash",
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyF",
  "KeyG",
  "KeyH",
  "KeyJ",
  "KeyK",
  "KeyL",
  "Semicolon",
  "Quote",
  "IntlBackslash",
  "KeyZ",
  "KeyX",
  "KeyC",
  "KeyV",
  "KeyB",
  "KeyN",
  "KeyM",
  "Comma",
  "Period",
  "Slash",
  "Space",
  "Enter",
];

const KEY_LABELS: Record<string, string> = {
  Space: "␣",
  Enter: "⏎",
  Tab: "⇥",
  Comma: ",",
  Period: ".",
  Slash: "/",
  Semicolon: ";",
  Quote: "'",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  IntlBackslash: "\\",
  Minus: "-",
  Equal: "=",
  Backquote: "`",
};

function keyLabel(code: string): string {
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  return KEY_LABELS[code] ?? code;
}

function percentileOf(values: number[], p: number): number {
  if (values.length === 0) return 1;
  const sorted = [...values].sort((a, b) => a - b);
  return Math.max(sorted[Math.floor(p * (sorted.length - 1))] as number, 1);
}

// Acklam's inverse normal CDF, used to place the theoretical quantiles on the
// Q-Q plot
type ScatterPoint = { x: number; y: number };

function ScatterPanel(props: {
  ctx: EventLog;
  /** the whole log - only used to fix the axis bounds so they hold still */
  fullCtx: EventLog;
}): JSXElement {
  const open = getScatterOpen;
  const setOpen = setScatterOpen;

  const spacing = createMemo(() => getKeypressSpacing(props.ctx));
  const durations = createMemo(() => getKeypressDurations(props.ctx));

  // axes come from the whole log so points fill into a fixed frame instead of
  // the scales lurching about with three points on screen
  const allSpacing = createMemo(() => getKeypressSpacing(props.fullCtx));
  const allDurations = createMemo(() => getKeypressDurations(props.fullCtx));

  const keydownCodes = createMemo(() => {
    const codes: string[] = [];
    for (const event of props.ctx.events) {
      if (event.type === "keydown") codes.push(event.data.code);
    }
    return codes;
  });

  // real keystrokes only - automatic inputs (delete on error, auto indent) have
  // no keypress behind them and reuse the triggering keystroke's timestamp
  const inserts = createMemo(() => {
    const list: { testMs: number; charIndex: number }[] = [];
    for (const event of props.ctx.events) {
      if (
        event.type === "input" &&
        event.data.inputType.startsWith("insert") &&
        event.data.automatic !== true
      ) {
        list.push({ testMs: event.testMs, charIndex: event.data.charIndex });
      }
    }
    return list;
  });

  const lagPoints = (): ScatterPoint[] => {
    const points: ScatterPoint[] = [];
    const values = spacing();
    for (let i = 0; i + 1 < values.length; i++) {
      points.push({
        x: values[i] as number,
        y: values[i + 1] as number,
      });
    }
    return points;
  };

  const indexPoints = (): ScatterPoint[] =>
    spacing().map((value, i) => ({ x: i, y: value }));

  const holdFlightPoints = (): ScatterPoint[] => {
    const points: ScatterPoint[] = [];
    const gaps = spacing();
    const holds = durations();
    for (let i = 0; i < gaps.length; i++) {
      const hold = holds[i];
      if (hold === undefined || hold <= 0) continue;
      points.push({ x: gaps[i] as number, y: hold });
    }
    return points;
  };

  /**
   * One column per physical key. Takes the values rather than reading holds
   * directly, because both arrays are indexed by keypress: durations[i] is the
   * hold of key i and spacing[i] is the gap that follows it, so the same
   * grouping works for either.
   */
  const perKey = (
    values: number[],
  ): { labels: string[]; points: ScatterPoint[] } => {
    const byCode = new Map<string, number[]>();
    const codes = keydownCodes();
    for (let i = 0; i < codes.length; i++) {
      const value = values[i];
      const code = codes[i];
      if (value === undefined || value <= 0 || code === undefined) continue;
      const list = byCode.get(code) ?? [];
      list.push(value);
      byCode.set(code, list);
    }
    const columns = [...byCode.keys()]
      .filter((code) => (byCode.get(code) as number[]).length >= 3)
      .sort((a, b) => {
        const ai = KEY_ORDER.indexOf(a);
        const bi = KEY_ORDER.indexOf(b);
        return (
          (ai === -1 ? KEY_ORDER.length : ai) -
          (bi === -1 ? KEY_ORDER.length : bi)
        );
      });
    const points: ScatterPoint[] = [];
    columns.forEach((code, columnIndex) => {
      (byCode.get(code) as number[]).forEach((value, occurrence) => {
        // deterministic spread so repeats on the same key do not stack into one
        // dot and hide how wide that key's spread is
        points.push({
          x: columnIndex + ((occurrence % 5) - 2) * 0.07,
          y: value,
        });
      });
    });
    return { labels: columns.map(keyLabel), points };
  };

  /**
   * The lognormal being compared against, fitted straight from the log mean and
   * log spread of the sample. Sigma comes back with the points because it is
   * the parameter of this fit - it belongs on this chart as context, not in the
   * stat row where it reads as a verdict.
   */
  const lognormalFit = createMemo(
    (): {
      points: ScatterPoint[];
      sigma: number | null;
    } => {
      const values = spacing()
        .filter((v) => v > 0)
        .sort((a, b) => a - b);
      if (values.length < 5) return { points: [], sigma: null };
      const logs = values.map((v) => Math.log(v));
      const mean = logs.reduce((a, b) => a + b, 0) / logs.length;
      const sigma = Math.sqrt(
        logs.reduce((a, b) => a + (b - mean) ** 2, 0) / logs.length,
      );
      return {
        points: values.map((value, i) => ({
          x: Math.exp(mean + sigma * probit((i + 0.5) / values.length)),
          y: value,
        })),
        sigma,
      };
    },
  );

  const charPositionPoints = (): ScatterPoint[] => {
    const points: ScatterPoint[] = [];
    const list = inserts();
    for (let i = 1; i < list.length; i++) {
      const previous = list[i - 1] as { testMs: number; charIndex: number };
      const current = list[i] as { testMs: number; charIndex: number };
      points.push({
        x: current.charIndex,
        y: current.testMs - previous.testMs,
      });
    }
    return points;
  };

  const holdPerKey = createMemo(() => perKey(durations()));
  const spacingPerKey = createMemo(() => perKey(spacing()));

  const spacingUpper = (): number => percentileOf(allSpacing(), 0.95);
  const durationUpper = (): number =>
    percentileOf(
      allDurations().filter((d) => d > 0),
      0.98,
    );

  return (
    <div class="bg-bg-secondary flex shrink-0 flex-col gap-2 rounded-lg p-3">
      <div class="flex items-center justify-between">
        <Balloon
          class="cursor-help text-xs tracking-wider text-sub uppercase"
          text="Scatter views of the same key timing. These read as shape rather than numbers - they get useful around 500 keystrokes (a 60s test) and are only suggestive on a short one."
          position="up"
          length="xlarge"
          break
        >
          Timing scatter ({spacing().length} keystrokes)
        </Balloon>
        <Button
          variant="text"
          fa={{ icon: open() ? "fa-chevron-up" : "fa-chevron-down" }}
          balloon={{ text: open() ? "Collapse" : "Expand" }}
          onClick={() => setOpen(!open())}
        />
      </div>
      <Show when={open()}>
        <div class="grid max-h-[50vh] grid-cols-1 gap-3 overflow-auto md:grid-cols-2 xl:grid-cols-3">
          <ScatterChart
            title="1. lag plot"
            balloon="Each gap against the one after it. Human typing is autocorrelated - slow keys follow slow keys - so the cloud tilts along the diagonal. An independent random generator gives a round featureless blob, and a timer driven one gives a visible grid of dots because both axes only take discrete values."
            points={lagPoints()}
            xTitle="spacing i (ms)"
            yTitle="spacing i+1 (ms)"
            xMax={spacingUpper()}
            yMax={spacingUpper()}
          />
          <ScatterChart
            title="2. spacing over time"
            balloon="Every gap in order. Humans drift - warming up, tiring, pausing - so the band wanders and throws isolated spikes. A bot draws a flat ribbon of constant thickness, and a timer driven one shows horizontal striping where values land on discrete levels."
            points={indexPoints()}
            xTitle="keystroke"
            yTitle="spacing (ms)"
            yMax={percentileOf(allSpacing(), 0.98)}
          />
          <ScatterChart
            title="3. hold vs flight"
            balloon="How long each key was held against the gap that followed it. Points above the dashed line are genuine rollover - the next key went down before this one came up - which is where keyOverlap comes from. Fast typists live above the line. A constant hold generator draws a flat horizontal band."
            points={holdFlightPoints()}
            xTitle="spacing to next key (ms)"
            yTitle="hold (ms)"
            xMax={spacingUpper()}
            yMax={durationUpper()}
            identityLine
          />
          <ScatterChart
            title="4. hold per key"
            balloon="One column of hold times per physical key, in keyboard order, for keys pressed at least 3 times. Humans show real structure - home row tighter and faster than the outer keys. A generator makes every column statistically identical, which is hard to fake without a per key model."
            points={holdPerKey().points}
            xTitle="key"
            yTitle="hold (ms)"
            yMax={durationUpper()}
            xTickLabels={holdPerKey().labels}
          />
          <ScatterChart
            title={`5. Q-Q vs lognormal${lognormalFit().sigma === null ? "" : ` (σ ${(lognormalFit().sigma as number).toFixed(2)})`}`}
            balloon="Observed spacing against what a lognormal with the same log mean and log spread predicts. Sigma in the title is the spread of that fit, on a log scale - human key spacing runs about 0.3 to 0.7. A straight line along the dashed diagonal means the fit describes the data; systematic curves away from it show exactly where the shape departs, and a step means two different mechanisms are mixed together."
            points={lognormalFit().points}
            xTitle="lognormal quantile (ms)"
            yTitle="observed (ms)"
            xMax={percentileOf(allSpacing(), 0.98)}
            yMax={percentileOf(allSpacing(), 0.98)}
            identityLine
          />
          <ScatterChart
            title="6. spacing by char position"
            balloon="Time to type each character against its position in the word. Humans show a clear spike at position 0 - word initiation costs real time - decaying across the word. A per character loop knows nothing about word boundaries, so it draws a flat band."
            points={charPositionPoints()}
            xTitle="char index in word"
            yTitle="spacing (ms)"
            yMax={percentileOf(allSpacing(), 0.98)}
          />
          <ScatterChart
            title="7. spacing per key"
            balloon="One column of gaps per physical key, in keyboard order, for keys pressed at least 3 times. This is the gap that follows each key, so it reads as how long that key takes to move away from rather than how long it is held. Expect far more structure than the hold version: the cost depends on what comes next, so a key reached by an awkward same hand digraph sits high while one that alternates hands sits low. A generator draws every gap from one distribution regardless of which key it just pressed, making every column the same."
            points={spacingPerKey().points}
            xTitle="key"
            yTitle="spacing to next key (ms)"
            yMax={spacingUpper()}
            xTickLabels={spacingPerKey().labels}
          />
        </div>
      </Show>
    </div>
  );
}

function ScatterChart(props: {
  title: string;
  balloon: string;
  points: ScatterPoint[];
  xTitle: string;
  yTitle: string;
  xMax?: number;
  yMax?: number;
  xTickLabels?: string[];
  identityLine?: boolean;
}): JSXElement {
  const annotations = createMemo(() => {
    if (props.identityLine !== true) return {};
    const limit = Math.min(props.xMax ?? Infinity, props.yMax ?? Infinity);
    if (!Number.isFinite(limit)) return {};
    const identity: AnnotationOptions = {
      type: "line",
      xMin: 0,
      yMin: 0,
      xMax: limit,
      yMax: limit,
      borderColor: getTheme().sub,
      borderWidth: 1,
      borderDash: [4, 4],
    };
    return { identity };
  });

  return (
    <div class="flex flex-col gap-1">
      <Balloon
        class="cursor-help font-mono text-xs text-text underline decoration-sub decoration-dotted underline-offset-2"
        text={props.balloon}
        position="up"
        length="xlarge"
        break
      >
        {props.title}
      </Balloon>
      <Show
        when={props.points.length > 0}
        fallback={
          <div
            class="flex items-center justify-center rounded bg-bg text-xs text-sub"
            style={{ height: `${SCATTER_HEIGHT}px` }}
          >
            No data
          </div>
        }
      >
        <div style={{ height: `${SCATTER_HEIGHT}px` }}>
          <ChartJs
            name={props.title}
            type="scatter"
            data={{
              datasets: [
                {
                  label: props.title,
                  data: props.points,
                  backgroundColor: getTheme().main,
                  borderColor: getTheme().main,
                  pointRadius: 1.5,
                  pointHoverRadius: 4,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: {
                  type: "linear",
                  min: 0,
                  max: props.xMax,
                  title: { display: true, text: props.xTitle },
                  ticks:
                    props.xTickLabels !== undefined
                      ? {
                          stepSize: 1,
                          autoSkip: false,
                          maxRotation: 90,
                          minRotation: 90,
                          font: { size: 8 },
                          callback: (value) =>
                            props.xTickLabels?.[Math.round(Number(value))] ??
                            "",
                        }
                      : { maxTicksLimit: 6 },
                },
                y: {
                  type: "linear",
                  min: 0,
                  max: props.yMax,
                  title: { display: true, text: props.yTitle },
                  ticks: { maxTicksLimit: 5 },
                },
              },
              plugins: {
                legend: { display: false },
                annotation: { annotations: annotations() },
                tooltip: {
                  displayColors: false,
                  callbacks: {
                    label: (item) => {
                      const point = item.raw as ScatterPoint;
                      const x =
                        props.xTickLabels !== undefined
                          ? (props.xTickLabels[Math.round(point.x)] ?? "")
                          : point.x.toFixed(1);
                      return `${props.xTitle}: ${x}, ${props.yTitle}: ${point.y.toFixed(1)}`;
                    },
                  },
                },
              },
            }}
          />
        </div>
      </Show>
    </div>
  );
}

function Stat(props: {
  label: string;
  value: string;
  balloon: string;
  /** outside the human range */
  bad?: boolean;
  /** not wrong, just not enough data to judge */
  warn?: boolean;
}): JSXElement {
  return (
    <Balloon
      class="flex cursor-help gap-1"
      text={props.balloon}
      position="up"
      length="xlarge"
      break
    >
      <span class="text-sub underline decoration-sub decoration-dotted underline-offset-2">
        {props.label}
      </span>
      <span
        class={cn(
          props.bad === true
            ? "text-error"
            : props.warn === true
              ? "text-main"
              : "text-text",
        )}
      >
        {props.value}
      </span>
    </Balloon>
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
