import preview from "#.storybook/preview";

import { AnimatedModal } from "../../src/ts/components/common/AnimatedModal";
import { ModalId, showModal } from "../../src/ts/states/modals";

function ModalTrigger(props: { modalId: ModalId; label: string }) {
  return (
    <button
      style={{
        padding: "8px 16px",
        cursor: "pointer",
        "background-color": "var(--sub-alt-color)",
        color: "var(--text-color)",
        border: "none",
        "border-radius": "8px",
      }}
      onClick={() => showModal(props.modalId)}
    >
      {props.label}
    </button>
  );
}

const meta = preview.meta({
  title: "Common/AnimatedModal",
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
  decorators: [
    (Story, context) => {
      // oxlint-disable-next-line typescript/no-unsafe-member-access -- storybook decorator context is untyped
      const modalId = context.args.id as ModalId;
      // oxlint-disable-next-line typescript/no-unsafe-member-access -- storybook decorator context is untyped
      const title = (context.args.title as string) ?? "Modal";
      return (
        <div>
          <ModalTrigger modalId={modalId} label={`Open ${title}`} />
          <Story />
        </div>
      );
    },
  ],
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
});
