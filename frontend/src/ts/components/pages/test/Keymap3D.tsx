import { createMemo, createSignal, For, Show } from "solid-js";

import { FlashEntry } from "../../../states/test";
import { cn } from "../../../utils/cn";
import { Anime } from "../../common/anime/Anime";
import { createKeyVisualState, keyLabel, KeyContent } from "./keymapKey";
import { KeyboardDefinition, KeyDefinition } from "./keymapLayouts";

/**
 * The board pose in degrees: tilt rotates the board around its horizontal
 * axis (like viewing a keyboard from further above or further away), rake
 * rotates it around the vertical axis.
 */
export type BoardPose = { tilt: number; rake: number };

export const BOARD_POSE_DEFAULT: BoardPose = { tilt: 55, rake: -5 };

/** Orbit is clamped so the board never shows key undersides. */
export const BOARD_POSE_LIMITS = {
  tilt: [20, 80],
  rake: [-30, 30],
} as const;

export function clampBoardPose(pose: BoardPose): BoardPose {
  return {
    tilt: Math.min(
      BOARD_POSE_LIMITS.tilt[1],
      Math.max(BOARD_POSE_LIMITS.tilt[0], pose.tilt),
    ),
    rake: Math.min(
      BOARD_POSE_LIMITS.rake[1],
      Math.max(BOARD_POSE_LIMITS.rake[0], pose.rake),
    ),
  };
}

// keycap and plate geometry, in rem (1 key = 2rem)
const KEYCAP_HEIGHT = 0.5;
// how far a key presses down while flashing
const KEYCAP_DIP = 0.18;
const PLATE_HEIGHT = 0.5;
// how hard the board responds to a 1px pointer drag, in degrees
const ORBIT_SPEED = 0.25;
// Long, near-orthographic projection: a short perspective distance stretches
// the board's front rows (eg. the spacebar row) relative to its 2d layout
export const PERSPECTIVE = 9600;

/**
 * The 3d keymap: a board of keycap slabs on a base plate, tilted in 3d and
 * rotatable by dragging. Pure presentation: all key data comes in via props.
 */
export function Keymap3D(props: {
  keyboardDef: KeyboardDefinition;
  layer: { index: number; symbolIndex?: number };
  showFirstRow: boolean;
  flashState: Record<string, FlashEntry | undefined>;
}) {
  const [pose, setPose] = createSignal<BoardPose>({ ...BOARD_POSE_DEFAULT });

  let drag: {
    active: boolean;
    x: number;
    y: number;
    pointerId: number;
  } = {
    active: false,
    x: 0,
    y: 0,
    pointerId: 0,
  };
  let perspectiveEl: HTMLDivElement | undefined;

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag = {
      active: true,
      x: e.clientX,
      y: e.clientY,
      pointerId: e.pointerId,
    };
    if (typeof perspectiveEl?.setPointerCapture === "function") {
      perspectiveEl.setPointerCapture(e.pointerId);
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!drag.active) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    drag.x = e.clientX;
    drag.y = e.clientY;
    const current = pose();
    // drag up tilts the board more top-down, dragging right turns it left
    setPose(
      clampBoardPose({
        tilt: current.tilt - dy * ORBIT_SPEED,
        rake: current.rake - dx * ORBIT_SPEED,
      }),
    );
  };

  const onPointerUp = () => {
    drag.active = false;
    if (
      typeof perspectiveEl?.releasePointerCapture === "function" &&
      perspectiveEl.hasPointerCapture(drag.pointerId)
    ) {
      perspectiveEl.releasePointerCapture(drag.pointerId);
    }
  };

  const boardTransform = () =>
    `rotateX(${pose().tilt}deg) rotateZ(${pose().rake}deg)`;

  // how far the lowest key body (with its rotated corners) drops below the
  // key column's bottom edge, in u: the plate rim must clear it
  const plateBottomInset = createMemo(() =>
    Math.max(0.75, maxKeyDropU(props.keyboardDef) + 0.15),
  );

  return (
    <div class="relative">
      {/* soft shadow on the page below the board, ahead of the perspective
          element so the board paints over it. Normal blend (not multiply):
          a multiply shadow vanishes on dark themes, where this should read as
          a light glow */}
      <div
        class="absolute right-[15%] -bottom-3 left-[15%] h-6 rounded-full bg-text opacity-30 blur-xl"
        aria-hidden
      ></div>
      <div
        ref={(el) => (perspectiveEl = el)}
        class="relative cursor-grab touch-pan-y select-none active:cursor-grabbing"
        style={{ perspective: `${PERSPECTIVE}px` }}
        data-keymap3d-root
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          class="transform-3d"
          style={{ transform: boardTransform() }}
          data-keymap3d-board
        >
          <div class="relative transform-3d">
            <Plate bottomInset={plateBottomInset()} />
            <div class="relative flex flex-col items-center transform-3d">
              <For each={props.keyboardDef}>
                {(keys, rowNum) => (
                  <Show when={rowNum() !== 0 || props.showFirstRow}>
                    <div class="flex h-8 flex-row transform-3d">
                      <For each={keys}>
                        {(key) => {
                          const label = () => keyLabel(key, props.layer);
                          const flashEntry = () =>
                            key.legends
                              .map((legend) => props.flashState[legend])
                              .find((it) => it !== undefined);
                          return (
                            <Keycap
                              {...key}
                              label={label()}
                              flashEntry={flashEntry}
                            />
                          );
                        }}
                      </For>
                    </div>
                  </Show>
                )}
              </For>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * How far the lowest key drops below the key column's bottom edge, in u.
 * Each row is 1u tall; a key at row i with offset y and height h ends at
 * i + y + h, so its drop below the column bottom (n rows) is i + y + h - n.
 * Rotated keys swing their corners further down.
 */
export function maxKeyDropU(keyboardDef: KeyboardDefinition): number {
  const rows = keyboardDef.length;
  let max = 0;
  keyboardDef.forEach((keys, i) => {
    for (const key of keys) {
      const width = key.width ?? 1;
      const height = key.height ?? 1;
      const rad = ((key.rotation ?? 0) * Math.PI) / 180;
      const rotExtra =
        (width * Math.abs(Math.sin(rad)) +
          height * (Math.abs(Math.cos(rad)) - 1)) /
        2;
      const drop = i + (key.y ?? 0) + height + rotExtra - rows;
      if (drop > max) max = drop;
    }
  });
  return max;
}

/**
 * The base plate the keys sit on, with a visible edge and rounded corners.
 * The bottom rim extends further than the other sides to clear keys that
 * drop below the column bottom edge (eg. alice's bottom row).
 */
function Plate(props: { bottomInset: number }) {
  return (
    <div
      class="absolute transform-3d"
      data-keymap3d-plate
      style={{
        top: "-0.75rem",
        right: "-0.75rem",
        left: "-0.75rem",
        bottom: `-${props.bottomInset}rem`,
      }}
    >
      <div
        class="absolute inset-0 rounded-2xl border border-sub/20 bg-sub-alt/30"
        style={{ transform: "translateZ(0px)" }}
      ></div>
      <div
        class="absolute top-full right-2 left-2 rounded-b-2xl bg-bg brightness-50"
        style={{
          height: `${PLATE_HEIGHT}rem`,
          "transform-origin": "top",
          transform: "rotateX(-90deg)",
        }}
      ></div>
    </div>
  );
}

/** A key rendered as a keycap slab: a raised top face with a front edge. */
function Keycap(
  props: {
    label: string;
    flashEntry: () => FlashEntry | undefined;
  } & KeyDefinition,
) {
  const visual = createKeyVisualState(props);

  // While the key is flashing it presses down, and back up again after.
  const keyHeight = `${KEYCAP_HEIGHT}rem`;
  const animKeyHeight = createMemo(() => {
    if (visual.flashInfo().tick === 0 || visual.isFading()) {
      return [keyHeight, keyHeight];
    }
    return [keyHeight, `${KEYCAP_HEIGHT - KEYCAP_DIP}rem`];
  });

  const rotation = () =>
    props.rotation !== undefined ? `rotate(${props.rotation}deg)` : "";

  return (
    <Anime
      data-keycap
      class="relative transform-3d"
      style={{
        "--key-h": keyHeight,
        "--keybgcolor": visual.baseKeyBgColor(),
        "--keycolor": visual.baseKeyColor(),
        height: `${(props.height ?? 1) * 2}rem`,
        width: `${(props.width ?? 1) * 2}rem`,
        "margin-left": `${(props.x ?? 0) * 2}rem`,
        "margin-top": `${(props.y ?? 0) * 2}rem`,
      }}
      // Don't apply reduced motion. If the user activates react/next they want animations.
      respectReducedMotion={false}
      animation={{
        "--key-h": animKeyHeight(),
        "--keybgcolor": visual.animKeyBgColor(),
        "--keycolor": visual.animKeyColor(),
        duration: visual.animDuration(),
        onComplete: () => visual.resetFlash(),
      }}
    >
      <div
        class={cn(
          "absolute inset-0 flex justify-center rounded border-2 border-bg bg-sub-alt text-sm",
          (props.label ?? "").length >= 2 && "text-em-xs",
          {
            "items-center": props.align !== "top",
            "items-start pt-1.5": props.align === "top",
          },
        )}
        data-keycap-top
        style={{
          transform: `${rotation()} translateZ(var(--key-h))`,
          "background-color": "var(--keybgcolor)",
          color: "var(--keycolor)",
        }}
      >
        <KeyContent {...props} visual={visual} />
      </div>
      {/* the keycap's front edge */}
      <div
        class="absolute top-full right-0 left-0 rounded bg-sub-alt brightness-75"
        data-keycap-front
        style={{
          height: "var(--key-h)",
          "transform-origin": "top",
          transform: `${rotation()} rotateX(90deg)`,
          "background-color": "var(--keybgcolor)",
        }}
      ></div>
    </Anime>
  );
}
