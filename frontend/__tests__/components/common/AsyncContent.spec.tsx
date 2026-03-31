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
import * as Notifications from "../../../src/ts/states/notifications";

describe("AsyncContent", () => {
  const notifyErrorMock = vi.spyOn(Notifications, "showErrorNotification");

  beforeEach(() => {
    notifyErrorMock.mockClear();
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
      const { container } = renderWithQuery({ result: "Test Data" });

      await waitFor(() => {
        expect(screen.getByTestId("content")).toHaveTextContent("Test Data");
      });
      const preloader = container.querySelector(".preloader");
      expect(preloader).not.toBeInTheDocument();
    });

    it("renders on resolve with object containing null", async () => {
      const { container } = renderWithQuery({
        result: { text: "Test Data", extra: null } as any,
      });

      await waitFor(() => {
        expect(screen.getByTestId("content")).toBeVisible();
      });
      expect(container.innerHTML).toContain("static content");
    });

    it("renders default error message on fail", async () => {
      const error = new Error("Test error");
      renderWithQuery({ result: error });

      await waitFor(() => {
        expect(screen.getByText(/An error occurred/)).toBeInTheDocument();
      });
      expect(notifyErrorMock).toHaveBeenCalledWith("An error occurred", {
        error,
      });
    });

    it("renders custom error message on fail", async () => {
      const error = new Error("Test error");
      renderWithQuery(
        { result: error },
        { errorMessage: "Custom error message" },
      );

      await waitFor(() => {
        expect(screen.getByText(/Custom error message/)).toBeInTheDocument();
      });
      expect(notifyErrorMock).toHaveBeenCalledWith("Custom error message", {
        error,
      });
    });

    it("ignores error on fail if ignoreError is set", async () => {
      renderWithQuery(
        { result: new Error("Test error") },
        { ignoreError: true, alwaysShowContent: true },
      );
      await waitFor(() => {
        expect(screen.getByText(/no data/)).toBeInTheDocument();
      });
      expect(notifyErrorMock).not.toHaveBeenCalled();
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
      const error = new Error("Test error");
      renderWithQuery(
        { result: error },
        { errorMessage: "Custom error message" },
      );

      await waitFor(() => {
        expect(screen.getByText(/Custom error message/)).toBeInTheDocument();
      });
      expect(notifyErrorMock).toHaveBeenCalledWith("Custom error message", {
        error,
      });
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
          <AsyncContent query={myQuery} {...(options as Props<string>)}>
            {(data: string | undefined) => (
              <>
                static content
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
      const { container } = renderWithQuery({
        first: "First Data",
        second: "Second Data",
      });

      await waitFor(() => {
        expect(screen.getByTestId("first")).toHaveTextContent("First Data");
      });
      await waitFor(() => {
        expect(screen.getByTestId("second")).toHaveTextContent("Second Data");
      });
      const preloader = container.querySelector(".preloader");
      expect(preloader).not.toBeInTheDocument();
    });

    it("renders default error message on fail", async () => {
      const error = new Error("Test error");
      renderWithQuery({ first: "data", second: error });

      await waitFor(() => {
        expect(screen.getByText(/An error occurred/)).toBeInTheDocument();
      });
      expect(notifyErrorMock).toHaveBeenCalledWith("An error occurred", {
        error,
      });
    });

    it("renders custom error message on fail", async () => {
      const firstError = new Error("First error");
      renderWithQuery(
        { first: firstError, second: new Error("Second error") },
        { errorMessage: "Custom error message" },
      );

      await waitFor(() => {
        expect(screen.getByText(/Custom error message/)).toBeInTheDocument();
      });
      expect(notifyErrorMock).toHaveBeenCalledWith("Custom error message", {
        error: firstError,
      });
    });

    it("ignores error on fail if ignoreError is set", async () => {
      renderWithQuery(
        { first: new Error("First error"), second: new Error("Second error") },
        { ignoreError: true, alwaysShowContent: true },
      );

      await waitFor(() => {
        expect(screen.getByText(/no data/)).toBeInTheDocument();
      });

      expect(notifyErrorMock).not.toHaveBeenCalled();
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
      const error = new Error("Test error");
      renderWithQuery(
        { first: "data", second: error },
        { errorMessage: "Custom error message" },
      );

      await waitFor(() => {
        expect(screen.getByText(/Custom error message/)).toBeInTheDocument();
      });
      expect(notifyErrorMock).toHaveBeenCalledWith("Custom error message", {
        error,
      });
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

        type Q = { first: string | undefined; second: string | undefined };
        return (
          <AsyncContent
            queries={{ first: firstQuery, second: secondQuery }}
            {...(options as Props<Q>)}
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
