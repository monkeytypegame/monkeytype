import preview from "#.storybook/preview";
import { Component } from "solid-js";

import { AnimeShow } from "../../src/ts/components/common/anime/AnimeShow";

const meta = preview.meta({
  title: "Monkeytype/AnimeShow",
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
