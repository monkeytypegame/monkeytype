import preview from "#.storybook/preview";
import { Component } from "solid-js";

import { Balloon } from "../../src/ts/components/common/Balloon";

const meta = preview.meta({
  title: "Common/Balloon",
  component: Balloon as Component,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    text: { control: "text" },
    position: {
      control: "select",
      options: ["up", "down", "left", "right"],
    },
    break: { control: "boolean" },
    length: {
      control: "select",
      options: ["small", "medium", "large", "xlarge", "fit"],
    },
    inline: { control: "boolean" },
  },
});

export const Default = meta.story(() => (
  <Balloon text="Tooltip text">
    <span style={{ color: "var(--text-color)", cursor: "pointer" }}>
      Hover me
    </span>
  </Balloon>
));

export const AllPositions = meta.story(() => (
  <div
    style={{
      display: "grid",
      "grid-template-columns": "repeat(2, 1fr)",
      gap: "48px",
      padding: "64px",
      color: "var(--text-color)",
    }}
  >
    <Balloon text="Tooltip above" position="up">
      <span style={{ cursor: "pointer" }}>Up</span>
    </Balloon>
    <Balloon text="Tooltip below" position="down">
      <span style={{ cursor: "pointer" }}>Down</span>
    </Balloon>
    <Balloon text="Tooltip left" position="left">
      <span style={{ cursor: "pointer" }}>Left</span>
    </Balloon>
    <Balloon text="Tooltip right" position="right">
      <span style={{ cursor: "pointer" }}>Right</span>
    </Balloon>
  </div>
));

export const Lengths = meta.story(() => (
  <div
    style={{
      display: "flex",
      "flex-direction": "column",
      gap: "32px",
      padding: "64px",
      color: "var(--text-color)",
    }}
  >
    <Balloon text="Short" length="small">
      <span style={{ cursor: "pointer" }}>Small</span>
    </Balloon>
    <Balloon text="A medium length tooltip message" length="medium">
      <span style={{ cursor: "pointer" }}>Medium</span>
    </Balloon>
    <Balloon
      text="A longer tooltip message that takes up more space"
      length="large"
    >
      <span style={{ cursor: "pointer" }}>Large</span>
    </Balloon>
    <Balloon
      text="An extra large tooltip with a lot of text content inside it"
      length="xlarge"
    >
      <span style={{ cursor: "pointer" }}>XLarge</span>
    </Balloon>
    <Balloon text="Fits content" length="fit">
      <span style={{ cursor: "pointer" }}>Fit</span>
    </Balloon>
  </div>
));

export const Inline = meta.story(() => (
  <p style={{ color: "var(--text-color)" }}>
    This is text with a{" "}
    <Balloon text="Inline tooltip" inline>
      <span
        style={{
          color: "var(--main-color)",
          cursor: "pointer",
          "text-decoration": "underline",
        }}
      >
        inline element
      </span>
    </Balloon>{" "}
    inside a sentence.
  </p>
));

export const WithBreak = meta.story(() => (
  <Balloon
    text="This is a very long tooltip message that should break into multiple lines when displayed"
    break
    length="medium"
  >
    <span style={{ color: "var(--text-color)", cursor: "pointer" }}>
      Hover for multiline tooltip
    </span>
  </Balloon>
));
