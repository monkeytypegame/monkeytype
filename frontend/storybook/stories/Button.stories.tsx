import { Component } from "solid-js";
import { fn } from "storybook/test";

import preview from "#.storybook/preview";

import { Button } from "../../src/ts/components/common/Button";

const meta = preview.meta({
  title: "Common/Button",
  component: Button as Component,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
});

export const Default = meta.story({
  render: () => <Button text="Button" type="button" onClick={fn()} />,
});

export const AllVariants = meta.story({
  render: () => (
    <div class="grid grid-cols-5 gap-4 text-text">
      <div class="self-center">Button</div>
      <Button text="Default" onClick={() => fn()} />
      <Button text="Active" active={true} onClick={() => fn()} />
      <Button text="Disabled" disabled={true} onClick={() => fn()} />
      <Button
        text="Active + Disabled"
        active={true}
        disabled={true}
        onClick={() => fn()}
      />

      <div class="self-center">Button + Icon</div>
      <Button
        text="Default"
        fa={{ icon: "fa-cog", variant: "solid" }}
        onClick={() => fn()}
      />
      <Button
        text="Active"
        fa={{ icon: "fa-cog", variant: "solid" }}
        active={true}
        onClick={() => fn()}
      />
      <Button
        text="Disabled"
        fa={{ icon: "fa-cog", variant: "solid" }}
        disabled={true}
        onClick={() => fn()}
      />
      <Button
        text="Active + Disabled"
        fa={{ icon: "fa-cog", variant: "solid" }}
        active={true}
        disabled={true}
        onClick={() => fn()}
      />

      <div class="self-center">Icon Only</div>
      <Button fa={{ icon: "fa-cog", variant: "solid" }} onClick={() => fn()} />
      <Button
        fa={{ icon: "fa-cog", variant: "solid" }}
        active={true}
        onClick={() => fn()}
      />
      <Button
        fa={{ icon: "fa-cog", variant: "solid" }}
        disabled={true}
        onClick={() => fn()}
      />
      <Button
        fa={{ icon: "fa-cog", variant: "solid" }}
        active={true}
        disabled={true}
        onClick={() => fn()}
      />

      <div class="self-center">Text</div>
      <Button variant="text" text="Default" onClick={() => fn()} />
      <Button variant="text" text="Active" active={true} onClick={() => fn()} />
      <Button
        variant="text"
        text="Disabled"
        disabled={true}
        onClick={() => fn()}
      />
      <Button
        variant="text"
        text="Active + Disabled"
        active={true}
        disabled={true}
        onClick={() => fn()}
      />

      <div class="self-center">Text + Icon</div>
      <Button
        variant="text"
        text="Default"
        fa={{ icon: "fa-cog", variant: "solid" }}
        onClick={() => fn()}
      />
      <Button
        variant="text"
        text="Active"
        fa={{ icon: "fa-cog", variant: "solid" }}
        active={true}
        onClick={() => fn()}
      />
      <Button
        variant="text"
        text="Disabled"
        fa={{ icon: "fa-cog", variant: "solid" }}
        disabled={true}
        onClick={() => fn()}
      />
      <Button
        variant="text"
        text="Active + Disabled"
        fa={{ icon: "fa-cog", variant: "solid" }}
        active={true}
        disabled={true}
        onClick={() => fn()}
      />
    </div>
  ),
});
