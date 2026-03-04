import preview from "#.storybook/preview";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";

import { Nav } from "../../src/ts/components/layout/header/Nav";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const meta = preview.meta({
  title: "Layout/Header/Nav",
  component: Nav,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div style={{ padding: "16px" }}>
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
});

export const Default = meta.story({});
