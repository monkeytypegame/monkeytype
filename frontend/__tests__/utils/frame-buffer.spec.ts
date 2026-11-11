import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createFrameBuffer } from "../../src/ts/utils/frame-buffer";

describe("frame-buffer.ts", () => {
  let frames: Map<number, FrameRequestCallback>;
  let nextFrame: number;

  beforeEach(() => {
    frames = new Map();
    nextFrame = 1;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      frames.set(nextFrame, cb);
      return nextFrame++;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function runFrames(): void {
    const pending = [...frames.values()];
    frames.clear();
    for (const cb of pending) cb(0);
  }

  function create(): {
    buffer: ReturnType<typeof createFrameBuffer<string[]>>;
    apply: ReturnType<typeof vi.fn>;
  } {
    const apply = vi.fn();
    const buffer = createFrameBuffer<string[]>(() => [], apply);
    return { buffer, apply };
  }

  it("applies writes from one frame in a single flush", () => {
    const { buffer, apply } = create();
    buffer.write((d) => d.push("a"));
    buffer.write((d) => d.push("b"));
    expect(frames.size).toBe(1);
    expect(apply).not.toHaveBeenCalled();

    runFrames();
    expect(apply).toHaveBeenCalledOnce();
    expect(apply).toHaveBeenCalledWith(["a", "b"]);
    expect(buffer.peek()).toEqual([]);
  });

  it("peek shows pending data", () => {
    const { buffer } = create();
    buffer.write((d) => d.push("a"));
    expect(buffer.peek()).toEqual(["a"]);
  });

  it("flush applies now and cancels the frame", () => {
    const { buffer, apply } = create();
    buffer.write((d) => d.push("a"));
    buffer.flush();
    expect(apply).toHaveBeenCalledWith(["a"]);
    expect(frames.size).toBe(0);
  });

  it("flush applies even when empty", () => {
    const { buffer, apply } = create();
    buffer.flush();
    expect(apply).toHaveBeenCalledWith([]);
  });

  it("clear drops data and cancels the frame", () => {
    const { buffer, apply } = create();
    buffer.write((d) => d.push("a"));
    buffer.clear();
    expect(frames.size).toBe(0);
    expect(buffer.peek()).toEqual([]);
    runFrames();
    expect(apply).not.toHaveBeenCalled();
  });

  it("schedules a new frame after a flush", () => {
    const { buffer, apply } = create();
    buffer.write((d) => d.push("a"));
    runFrames();
    buffer.write((d) => d.push("b"));
    runFrames();
    expect(apply).toHaveBeenNthCalledWith(2, ["b"]);
  });
});
