import preview from "#.storybook/preview";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";

import { Header } from "../../src/ts/components/layout/header/Header";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const meta = preview.meta({
  title: "Layout/Header",
  component: Header,
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
