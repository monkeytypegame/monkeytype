import preview from "#.storybook/preview";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/solid-query";

import AsyncContent from "../../src/ts/components/common/AsyncContent";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const meta = preview.meta({
  title: "Common/AsyncContent",
  // oxlint-disable-next-line typescript/no-unsafe-assignment -- generic component
  component: AsyncContent as unknown as () => ReturnType<typeof AsyncContent>,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
});

function LoadingExample(): ReturnType<typeof AsyncContent> {
  const query = useQuery(() => ({
    queryKey: ["storybook-loading"],
    queryFn: async () => new Promise<string>(() => undefined),
  }));

  return (
    <AsyncContent queries={{ query }}>
      {({ queryData }) => <div>{queryData()}</div>}
    </AsyncContent>
  );
}

function SuccessExample(): ReturnType<typeof AsyncContent> {
  const query = useQuery(() => ({
    queryKey: ["storybook-success"],
    queryFn: async () => "Hello World",
  }));

  return (
    <AsyncContent queries={{ query }}>
      {({ queryData }) => (
        <div style={{ color: "var(--text-color)" }}>{queryData()}</div>
      )}
    </AsyncContent>
  );
}

function ErrorExample(): ReturnType<typeof AsyncContent> {
  const query = useQuery(() => ({
    queryKey: ["storybook-error"],
    queryFn: async () => {
      throw new globalThis.Error("Failed to fetch");
    },
  }));

  return (
    <AsyncContent queries={{ query }} errorMessage="Could not load data">
      {() => <div>This won't render</div>}
    </AsyncContent>
  );
}

export const Loading = meta.story({
  render: () => <LoadingExample />,
});

export const Success = meta.story({
  render: () => <SuccessExample />,
});

export const WithError = meta.story({
  render: () => <ErrorExample />,
});
