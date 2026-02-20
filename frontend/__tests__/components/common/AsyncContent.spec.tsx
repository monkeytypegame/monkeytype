import { render, screen, waitFor } from "@solidjs/testing-library";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/solid-query";
import { JSXElement, Show } from "solid-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AsyncContent, {
  Props,
} from "../../../src/ts/components/common/AsyncContent";
import * as Notifications from "../../../src/ts/elements/notifications";

describe("AsyncContent", () => {
  const addNotificationMock = vi.spyOn(Notifications, "add");

  beforeEach(() => {
    addNotificationMock.mockClear();
  });

  describe("with single query", () => {
    const queryClient = new QueryClient();

    it("renders loading state while pending", () => {
      const { container } = renderWithQuery({ result: "data" });

      const preloader = container.querySelector(".preloader");
      expect(preloader).toBeInTheDocument();
      expect(preloader?.querySelector("i")).toHaveClass(
        "fas",
        "fa-fw",
        "fa-spin",
        "fa-circle-notch",
      );
    });

    it("renders custom loader while pending", () => {
      const { container } = renderWithQuery(
        { result: "data" },
        { loader: <span class="preloader">Loading...</span> },
      );

      const preloader = container.querySelector(".preloader");
      expect(preloader).toBeInTheDocument();
      expect(preloader).toHaveTextContent("Loading...");
    });

    it("renders on resolve", async () => {
      renderWithQuery({ result: "Test Data" });

      await waitFor(() => {
        expect(screen.getByTestId("content")).toHaveTextContent("Test Data");
      });
    });

    it("renders default error message on fail", async () => {
      renderWithQuery({ result: new Error("Test error") });

      await waitFor(() => {
        expect(screen.getByText(/An error occurred/)).toBeInTheDocument();
      });
      expect(addNotificationMock).toHaveBeenCalledWith(
        "An error occurred: Test error",
        -1,
      );
    });

    it("renders custom error message on fail", async () => {
      renderWithQuery(
        { result: new Error("Test error") },
        { errorMessage: "Custom error message" },
      );

      await waitFor(() => {
        expect(screen.getByText(/Custom error message/)).toBeInTheDocument();
      });
      expect(addNotificationMock).toHaveBeenCalledWith(
        "Custom error message: Test error",
        -1,
      );
    });

    it("ignores error on fail if ignoreError is set", async () => {
      renderWithQuery(
        { result: new Error("Test error") },
        { ignoreError: true, alwaysShowContent: true },
      );
      await waitFor(() => {
        expect(screen.getByText(/no data/)).toBeInTheDocument();
      });
      expect(addNotificationMock).not.toHaveBeenCalled();
    });

    it("renders on pending if alwaysShowContent", async () => {
      const { container } = renderWithQuery({ result: "Test Data" });

      await waitFor(() => {
        expect(screen.getByTestId("content")).toHaveTextContent("Test Data");
      });
      const preloader = container.querySelector(".preloader");
      expect(preloader).not.toBeInTheDocument();
    });

    it("renders on resolve if alwaysShowContent", async () => {
      renderWithQuery({ result: "Test Data" }, { alwaysShowContent: true });

      await waitFor(() => {
        expect(screen.getByTestId("content")).toHaveTextContent("Test Data");
      });
    });

    it("renders on fail if alwaysShowContent", async () => {
      renderWithQuery(
        { result: new Error("Test error") },
        { errorMessage: "Custom error message" },
      );

      await waitFor(() => {
        expect(screen.getByText(/Custom error message/)).toBeInTheDocument();
      });
      expect(addNotificationMock).toHaveBeenCalledWith(
        "Custom error message: Test error",
        -1,
      );
    });

    function renderWithQuery(
      query: {
        result: string | Error;
      },
      options?: Omit<Props<unknown>, "query" | "queries" | "children">,
    ): {
      container: HTMLElement;
    } {
      const wrapper = (): JSXElement => {
        const myQuery = useQuery(() => ({
          queryKey: ["test", Math.random() * 1000],
          queryFn: async () => {
            await new Promise((resolve) => setTimeout(resolve, 100));
            if (query.result instanceof Error) {
              throw query.result;
            }
            return query.result;
          },
          retry: 0,
        }));

        return (
          <AsyncContent
            query={myQuery}
            errorMessage={options?.errorMessage}
            alwaysShowContent={options?.alwaysShowContent}
            ignoreError={options?.ignoreError}
            loader={options?.loader}
          >
            {(data: string | undefined) => (
              <>
                foo
                <Show when={data !== undefined} fallback={<div>no data</div>}>
                  <div data-testid="content">{data}</div>
                </Show>
              </>
            )}
          </AsyncContent>
        );
      };
      const { container } = render(() => (
        <QueryClientProvider client={queryClient}>
          {wrapper()}
        </QueryClientProvider>
      ));

      return {
        container,
      };
    }
  });

  describe("with multiple queries", () => {
    const queryClient = new QueryClient();

    it("renders loading state while pending", () => {
      const { container } = renderWithQuery({ first: "data", second: "data" });

      const preloader = container.querySelector(".preloader");
      expect(preloader).toBeInTheDocument();
      expect(preloader?.querySelector("i")).toHaveClass(
        "fas",
        "fa-fw",
        "fa-spin",
        "fa-circle-notch",
      );
    });

    it("renders custom loader while pending", () => {
      const { container } = renderWithQuery(
        { first: "data", second: "data" },
        { loader: <span class="preloader">Loading...</span> },
      );

      const preloader = container.querySelector(".preloader");
      expect(preloader).toBeInTheDocument();
      expect(preloader).toHaveTextContent("Loading...");
    });

    it("renders on resolve", async () => {
      renderWithQuery({ first: "First Data", second: "Second Data" });

      await waitFor(() => {
        expect(screen.getByTestId("first")).toHaveTextContent("First Data");
      });
      await waitFor(() => {
        expect(screen.getByTestId("second")).toHaveTextContent("Second Data");
      });
    });

    it("renders default error message on fail", async () => {
      renderWithQuery({ first: "data", second: new Error("Test error") });

      await waitFor(() => {
        expect(screen.getByText(/An error occurred/)).toBeInTheDocument();
      });
      expect(addNotificationMock).toHaveBeenCalledWith(
        "An error occurred: Test error",
        -1,
      );
    });

    it("renders custom error message on fail", async () => {
      renderWithQuery(
        { first: new Error("First error"), second: new Error("Second error") },
        { errorMessage: "Custom error message" },
      );

      await waitFor(() => {
        expect(screen.getByText(/Custom error message/)).toBeInTheDocument();
      });
      expect(addNotificationMock).toHaveBeenCalledWith(
        "Custom error message: First error",
        -1,
      );
    });

    it("ignores error on fail if ignoreError is set", async () => {
      renderWithQuery(
        { first: new Error("First error"), second: new Error("Second error") },
        { ignoreError: true, alwaysShowContent: true },
      );

      await waitFor(() => {
        expect(screen.getByText(/no data/)).toBeInTheDocument();
      });

      expect(addNotificationMock).not.toHaveBeenCalled();
    });

    it("renders on pending if alwaysShowContent", async () => {
      const { container } = renderWithQuery(
        {
          first: undefined,
          second: undefined,
        },
        { alwaysShowContent: true },
      );

      const preloader = container.querySelector(".preloader");
      expect(preloader).not.toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText(/no data/)).toBeInTheDocument();
      });
    });

    it("renders on resolve if alwaysShowContent", async () => {
      renderWithQuery({
        first: "First Data",
        second: "Second Data",
      });

      await waitFor(() => {
        expect(screen.getByTestId("first")).toHaveTextContent("First Data");
      });
      await waitFor(() => {
        expect(screen.getByTestId("second")).toHaveTextContent("Second Data");
      });
    });

    it("renders on fail if alwaysShowContent", async () => {
      renderWithQuery(
        { first: "data", second: new Error("Test error") },
        { errorMessage: "Custom error message" },
      );

      await waitFor(() => {
        expect(screen.getByText(/Custom error message/)).toBeInTheDocument();
      });
      expect(addNotificationMock).toHaveBeenCalledWith(
        "Custom error message: Test error",
        -1,
      );
    });

    function renderWithQuery(
      queries: {
        first: string | Error | undefined;
        second: string | Error | undefined;
      },
      options?: Omit<Props<unknown>, "query" | "queries" | "children">,
    ): {
      container: HTMLElement;
    } {
      const wrapper = (): JSXElement => {
        const firstQuery = useQuery(() => ({
          queryKey: ["first", Math.random() * 1000],
          queryFn: async () => {
            await new Promise((resolve) => setTimeout(resolve, 100));
            if (queries.first instanceof Error) {
              throw queries.first;
            }
            return queries.first;
          },
          retry: 0,
        }));
        const secondQuery = useQuery(() => ({
          queryKey: ["second", Math.random() * 1000],
          queryFn: async () => {
            await new Promise((resolve) => setTimeout(resolve, 100));
            if (queries.second instanceof Error) {
              throw queries.second;
            }
            return queries.second;
          },
          retry: 0,
        }));

        return (
          <AsyncContent
            queries={{ first: firstQuery, second: secondQuery }}
            errorMessage={options?.errorMessage}
            alwaysShowContent={options?.alwaysShowContent}
            ignoreError={options?.ignoreError}
            loader={options?.loader}
          >
            {(results: {
              first: string | undefined;
              second: string | undefined;
            }) => (
              <>
                <Show
                  when={
                    results.first !== undefined && results.second !== undefined
                  }
                  fallback={<div>no data</div>}
                >
                  <div data-testid="first">{results.first}</div>
                  <div data-testid="second">{results.second}</div>
                </Show>
              </>
            )}
          </AsyncContent>
        );
      };
      const { container } = render(() => (
        <QueryClientProvider client={queryClient}>
          {wrapper()}
        </QueryClientProvider>
      ));

      return {
        container,
      };
    }
  });
});
