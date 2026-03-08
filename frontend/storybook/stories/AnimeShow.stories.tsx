import preview from "#.storybook/preview";
import { Component, createSignal } from "solid-js";

import { AnimeShow } from "../../src/ts/components/common/anime/AnimeShow";

const meta = preview.meta({
  title: "Common/Anime/AnimeShow",
  component: AnimeShow as Component<{
    when: boolean;
    slide?: true;
    duration?: number;
    class?: string;
  }>,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    when: { control: "boolean" },
    slide: { control: "boolean" },
    duration: { control: "number" },
  },
});

export const FadeToggle = meta.story({
  args: {
    when: true,
    children: (
      <div style={{ color: "var(--text-color)", padding: "16px" }}>
        This content fades in and out
      </div>
    ),
  },
});

export const SlideToggle = meta.story({
  args: {
    when: true,
    slide: true,
    duration: 250,
    children: (
      <div style={{ color: "var(--text-color)", padding: "16px" }}>
        This content slides in and out
      </div>
    ),
  },
});

export const InteractiveDemo = meta.story({
  render: () => {
    const [show, setShow] = createSignal(true);
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
          onClick={() => setShow((prev) => !prev)}
        >
          Toggle ({show() ? "visible" : "hidden"})
        </button>
        <div style={{ display: "flex", gap: "24px" }}>
          <div>
            <div style={{ "font-size": "12px", color: "var(--sub-color)" }}>
              Fade
            </div>
            <AnimeShow when={show()}>
              <div style={{ color: "var(--text-color)", padding: "16px" }}>
                Fade content
              </div>
            </AnimeShow>
          </div>
          <div>
            <div style={{ "font-size": "12px", color: "var(--sub-color)" }}>
              Slide
            </div>
            <AnimeShow when={show()} slide duration={250}>
              <div style={{ color: "var(--text-color)", padding: "16px" }}>
                Slide content
              </div>
            </AnimeShow>
          </div>
        </div>
      </div>
    );
  },
});
