import preview from "#.storybook/preview";
import { AnimationParams } from "animejs";
import { Component, createSignal } from "solid-js";

import { Anime } from "../../src/ts/components/common/anime/Anime";

const meta = preview.meta({
  title: "Common/Anime/Anime",
  component: Anime as Component,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
});

const box = {
  width: "100px",
  height: "100px",
  "background-color": "var(--main-color)",
  "border-radius": "8px",
  display: "flex",
  "align-items": "center",
  "justify-content": "center",
  color: "var(--bg-color)",
  "font-weight": "bold",
};

export const FadeIn = meta.story({
  render: () => (
    <Anime
      initial={{ opacity: 0 } as Partial<AnimationParams>}
      animate={{ opacity: 1, duration: 600 } as AnimationParams}
    >
      <div style={box}>Fade In</div>
    </Anime>
  ),
});

export const SlideIn = meta.story({
  render: () => (
    <Anime
      initial={{ opacity: 0, translateY: -30 } as Partial<AnimationParams>}
      animate={{ opacity: 1, translateY: 0, duration: 500 } as AnimationParams}
    >
      <div style={box}>Slide In</div>
    </Anime>
  ),
});

export const ReactiveAnimation = meta.story({
  render: () => {
    const [expanded, setExpanded] = createSignal(false);
    return (
      <div>
        <button
          style={{
            padding: "8px 16px",
            cursor: "pointer",
            "background-color": "var(--sub-alt-color)",
            color: "var(--text-color)",
            border: "none",
            "border-radius": "8px",
            "margin-bottom": "16px",
          }}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded() ? "Shrink" : "Expand"}
        </button>
        <Anime
          animation={
            {
              scale: expanded() ? 1.5 : 1,
              rotate: expanded() ? 45 : 0,
              duration: 400,
            } as AnimationParams
          }
        >
          <div style={box}>Click</div>
        </Anime>
      </div>
    );
  },
});

export const CustomElement = meta.story({
  render: () => (
    <Anime
      as="span"
      initial={{ opacity: 0, translateX: -20 } as Partial<AnimationParams>}
      animate={{ opacity: 1, translateX: 0, duration: 400 } as AnimationParams}
      style={{ display: "inline-block" }}
    >
      <span style={{ color: "var(--text-color)" }}>
        Rendered as a {"<span>"}
      </span>
    </Anime>
  ),
});
