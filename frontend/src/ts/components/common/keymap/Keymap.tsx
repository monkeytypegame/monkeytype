import type {
  KeymapKeys,
  KeymapLegendStyle,
  KeymapStyle,
} from "@monkeytype/schemas/configs";

import { LayoutObject } from "@monkeytype/schemas/layouts";
import { createMemo, createSignal, For, Show, untrack } from "solid-js";

import { getTheme } from "../../../theme/state";
import { cn } from "../../../utils/cn";
import { isMacLike } from "../../../utils/misc";
import { Anime } from "../anime";
import { Button } from "../Button";
import { convertLayoutToKeymap } from "./keymapConverter";
import { KeyDefinition } from "./keymapLayouts";

const symbolsPattern = /^[^\p{L}\p{N}]{1}$/u;

const FLASH_MS = 250;

/**
 * A key's flash. It plays whenever its tick changes, so to flash a key again
 * raise the tick; a played flash never needs clearing.
 */
export type KeyFlash = { tick: number; correct: boolean };

/** How the keymap looks: layout, style and size. */
export type KeymapLook = {
  layout: LayoutObject;
  /** shown on the layout indicator key */
  layoutName: string;
  style: KeymapStyle;
  legendStyle: KeymapLegendStyle;
  /** which keys are drawn */
  shownKeys: KeymapKeys;
  /** zoom factor, capped per screen size */
  scale: number;
  /**
   * how long keys take to fade in and out of their highlight, in ms. Unset or
   * 0 switches at once
   */
  highlightAnimationMs?: number;
};

/**
 * What the keys are doing, each named by legend (the character on the key) or
 * by code (the physical key, KeyboardEvent.code). All of it shows at once: a
 * key can be highlighted and flash together. Leave out what doesn't apply.
 */
export type KeymapKeyState = {
  /** picks the legend layer (dynamic legends) */
  modifiers?: { shift: boolean; alt: boolean; capsLock: boolean };
  /** keys filled with the main colour, by legend */
  legendHighlights?: ReadonlySet<string>;
  /** keys filled with the main colour, by code */
  codeHighlights?: ReadonlySet<string>;
  /** flashes by legend */
  legendFlashes?: Record<string, KeyFlash | undefined>;
  /** flashes by code */
  codeFlashes?: Record<string, KeyFlash | undefined>;
};

export type KeymapProps = KeymapLook &
  KeymapKeyState & {
    onLayoutIndicatorClick?: () => void;
  };

type LegendLayer = { index: number; symbolIndex?: number };

/**
 * A keymap drawn purely from its props: no config or test state, so it can
 * show any layout, highlight or flashes (the test, a replay, a preview).
 */
export function Keymap(props: KeymapProps) {
  const layer = createMemo((): LegendLayer => {
    const shift = props.modifiers?.shift === true;
    const alt = props.modifiers?.alt === true;
    const capsLock = props.modifiers?.capsLock === true;

    // Windows and Linux capitalize letters with Shift OR CapsLock, but not
    // both at once. MacOS capitalizes when either or both are on.
    const isShifted = isMacLike() ? shift || capsLock : shift !== capsLock;

    switch (props.legendStyle) {
      case "blank":
        return { index: -1 };
      case "uppercase":
        return { index: 1, symbolIndex: 0 };
      case "dynamic":
        if (shift && alt) return { index: 3 };
        if (alt) return { index: 2 };
        return { index: isShifted ? 1 : 0, symbolIndex: shift ? 1 : 0 };
      default:
        return { index: 0 };
    }
  });

  const showFirstRow = (): boolean =>
    props.shownKeys === "full" ||
    props.shownKeys === "minimal_numrow" ||
    (props.shownKeys === "minimal" && props.layout.keymapShowTopRow);

  const rows = createMemo(() =>
    convertLayoutToKeymap(props.layout, {
      keymapStyle: props.style,
      showAllKeys:
        props.shownKeys === "full" ||
        props.layout.matrixShowRightColumn === true,
    }),
  );

  return (
    <div
      data-ui-element="keymap"
      class="flex w-full flex-col items-center py-8 text-sm text-sub"
    >
      <div
        class="w-fit xxs:zoom-(--kb-zoom-xxs) xs:zoom-(--kb-zoom-xs) sm:zoom-(--kb-zoom-sm) md:zoom-(--kb-zoom-md) lg:zoom-(--kb-zoom-lg) xl:zoom-(--kb-zoom-xl) 2xl:zoom-(--kb-zoom-2xl)"
        style={{
          "--kb-zoom-xxs": Math.min(props.scale, 0.5),
          "--kb-zoom-xs": Math.min(props.scale, 0.7),
          "--kb-zoom-sm": Math.min(props.scale, 1),
          "--kb-zoom-md": Math.min(props.scale, 1.3),
          "--kb-zoom-lg": Math.min(props.scale, 1.7),
          "--kb-zoom-xl": Math.min(props.scale, 2.2),
          "--kb-zoom-2xl": Math.min(props.scale, 2.9),
        }}
      >
        <For each={rows()}>
          {(keys, rowNum) => (
            <Show when={rowNum() !== 0 || showFirstRow()}>
              <div class="flex h-8 flex-row">
                <For each={keys}>
                  {(key) => <Key {...key} layer={layer()} keymap={props} />}
                </For>
              </div>
            </Show>
          )}
        </For>
      </div>
    </div>
  );
}

function Key(
  props: KeyDefinition & { layer: LegendLayer; keymap: KeymapProps },
) {
  const label = (): string => {
    const { index, symbolIndex } = props.layer;
    const legend = props.legends[index];
    if (symbolIndex === undefined) return legend ?? "";
    const symbol = props.legends[symbolIndex];
    const isSymbol = [legend, symbol].some((character) =>
      symbolsPattern.test(character ?? ""),
    );
    return (isSymbol ? symbol : legend) ?? "";
  };

  // steno keys never flash and are never highlighted by legend
  const isSteno = (): boolean =>
    props.keymap.style === "steno" || props.keymap.style === "steno_matrix";

  const isFilled = createMemo(
    () =>
      (!isSteno() &&
        props.legends.some(
          (legend) => props.keymap.legendHighlights?.has(legend) === true,
        )) ||
      (props.code !== undefined &&
        props.keymap.codeHighlights?.has(props.code) === true),
  );

  // every flash aimed at this key, named `code:…` or `legend:…`
  const flashes = (): [string, KeyFlash][] => {
    const found: [string, KeyFlash][] = [];
    const byCode =
      props.code !== undefined
        ? props.keymap.codeFlashes?.[props.code]
        : undefined;
    if (byCode !== undefined) found.push([`code:${props.code}`, byCode]);
    for (const legend of props.legends) {
      const byLegend = props.keymap.legendFlashes?.[legend];
      if (byLegend !== undefined) found.push([`legend:${legend}`, byLegend]);
    }
    return found;
  };
  const currentTicks = (): Record<string, number> =>
    Object.fromEntries(flashes().map(([name, flash]) => [name, flash.tick]));

  // the tick each flash had when it last finished playing, by name. Flashes
  // already there on mount count as played: a remount replays nothing
  const [playedTicks, setPlayedTicks] = createSignal(untrack(currentTicks));

  // the flash to play: one whose tick changed since it last played
  const pendingFlash = createMemo((): KeyFlash | undefined => {
    if (isSteno()) return undefined;
    const played = playedTicks();
    return flashes().find(([name, flash]) => flash.tick !== played[name])?.[1];
  });

  const bgColor = (): string =>
    isFilled() ? getTheme().main : getTheme().subAlt;
  const textColor = (): string => (isFilled() ? getTheme().bg : getTheme().sub);

  const animation = createMemo(() => {
    const flash = pendingFlash();
    if (flash === undefined) {
      return {
        "--keybgcolor": [bgColor()],
        "--keycolor": [textColor()],
        duration: props.keymap.highlightAnimationMs ?? 0,
      };
    }
    return {
      "--keybgcolor": [
        flash.correct ? getTheme().main : getTheme().error,
        bgColor(),
      ],
      "--keycolor": [getTheme().bg, textColor()],
      duration: FLASH_MS,
    };
  });

  return (
    <Anime
      class={cn(
        "relative flex justify-center rounded border-2 border-bg bg-sub-alt",
        label().length >= 2 && "text-em-xs",
        props.align === "top" ? "items-start pt-1.5" : "items-center",
      )}
      style={{
        // the colours on mount; the animation sets them after that
        "--keybgcolor": untrack(bgColor),
        "--keycolor": untrack(textColor),
        height: `${(props.height ?? 1) * 2}rem`,
        width: `${(props.width ?? 1) * 2}rem`,
        "margin-left": `${(props.x ?? 0) * 2}rem`,
        "margin-top": `${(props.y ?? 0) * 2}rem`,
        transform:
          props.rotation !== undefined ? `rotate(${props.rotation}deg)` : "",
        "background-color": "var(--keybgcolor)",
        color: "var(--keycolor)",
      }}
      // no reduced motion: whoever turns highlights or flashes on wants them
      respectReducedMotion={false}
      animation={{
        ...animation(),
        onComplete: () => {
          // also runs after highlight changes: only flashes get marked
          if (pendingFlash() !== undefined) setPlayedTicks(currentTicks());
        },
      }}
    >
      <Show
        when={props.isLayoutIndicator && props.keymap.legendStyle !== "blank"}
        fallback={
          <>
            {label()}
            <Show when={props.isHoming}>
              <div class="bg-em-xs absolute bottom-0.75 left-auto h-0.5 w-2 rounded bg-bg"></div>
            </Show>
          </>
        }
      >
        <Button
          variant="text"
          class="text-[0.5em] [--themable-button-bg:transparent] [--themable-button-text:var(--keycolor)]"
          text={props.keymap.layoutName}
          onClick={() => props.keymap.onLayoutIndicatorClick?.()}
          tabIndex={-1}
        />
      </Show>
    </Anime>
  );
}
