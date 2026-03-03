import preview from "#.storybook/preview";

import { AnimatedModal } from "../../src/ts/components/common/AnimatedModal";
import { showModal } from "../../src/ts/stores/modals";

const meta = preview.meta({
  title: "Monkeytype/AnimatedModal",
  component: AnimatedModal,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    mode: { control: "select", options: ["modal", "dialog"] },
    animationMode: {
      control: "select",
      options: ["none", "both", "modalOnly"],
    },
    title: { control: "text" },
    modalClass: { control: "text" },
    wrapperClass: { control: "text" },
  },
});

export const Default = meta.story({
  args: {
    id: "Contact",
    title: "Example Modal",
    children: (
      <div>
        <p>This is modal content.</p>
      </div>
    ),
  },
  decorators: [
    (Story) => {
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
            }}
            onClick={() => showModal("Contact")}
          >
            Open Modal
          </button>
          <Story />
        </div>
      );
    },
  ],
});

export const NoAnimation = meta.story({
  args: {
    id: "Support",
    title: "No Animation Modal",
    animationMode: "none",
    children: (
      <div>
        <p>This modal has no animation.</p>
      </div>
    ),
  },
  decorators: [
    (Story) => {
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
            }}
            onClick={() => showModal("Support")}
          >
            Open Modal
          </button>
          <Story />
        </div>
      );
    },
  ],
});

export const DialogMode = meta.story({
  args: {
    id: "DevOptions",
    mode: "dialog",
    title: "Dialog Mode",
    children: (
      <div>
        <p>This uses dialog mode instead of modal.</p>
      </div>
    ),
  },
  decorators: [
    (Story) => {
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
            }}
            onClick={() => showModal("DevOptions")}
          >
            Open Dialog
          </button>
          <Story />
        </div>
      );
    },
  ],
});
