import { render, screen, waitFor } from "@solidjs/testing-library";
import { createResource, Resource, Show } from "solid-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AsyncContent from "../../../src/ts/components/common/AsyncContent";
import * as Notifications from "../../../src/ts/elements/notifications";

describe("AsyncContent", () => {
  const addNotificationMock = vi.spyOn(Notifications, "add");

  beforeEach(() => {
    addNotificationMock.mockClear();
  });
  describe("with resource", () => {
    it("renders loading state while resource is pending", () => {
      const [resource] = createResource(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return "data";
      });

      const { container } = renderWithResource(resource);

      const preloader = container.querySelector(".preloader");
      expect(preloader).toBeInTheDocument();
      expect(preloader).toHaveClass("preloader");
      expect(preloader?.querySelector("i")).toHaveClass(
        "fas",
        "fa-fw",
        "fa-spin",
        "fa-circle-notch",
      );
    });

    it("renders data when resource resolves", async () => {
      const [resource] = createResource(async () => {
        return "Test Data";
      });

      renderWithResource(resource);

      await waitFor(() => {
        expect(screen.getByTestId("content")).toHaveTextContent("Test Data");
      });
    });

    it("renders error message when resource fails", async () => {
      const [resource] = createResource(async () => {
        throw new Error("Test error");
      });

      renderWithResource(resource, "Custom error message");

      await waitFor(() => {
        expect(screen.getByText(/Custom error message/)).toBeInTheDocument();
      });
      expect(addNotificationMock).toHaveBeenCalledWith(
        "Custom error message: Test error",
        -1,
      );
    });

    it("renders default error message when no custom message provided", async () => {
      const [resource] = createResource(async () => {
        throw new Error("Test error");
      });

      renderWithResource(resource);

      await waitFor(() => {
        expect(screen.getByText(/An error occurred/)).toBeInTheDocument();
      });
      expect(addNotificationMock).toHaveBeenCalledWith(
        "An error occurred: Test error",
        -1,
      );
    });

    it("renders content while resource is pending if alwaysShowContent", () => {
      const [resource] = createResource(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return "data";
      });

      const { container } = renderWithResource(resource, undefined, true);

      const preloader = container.querySelector(".preloader");
      expect(preloader).not.toBeInTheDocument();
      expect(container.querySelector("div")).toHaveTextContent("no data");
    });

    it("renders data when resource resolves if alwaysShowContent", async () => {
      const [resource] = createResource(async () => {
        return "Test Data";
      });

      const { container } = renderWithResource(resource, undefined, true);

      await waitFor(() => {
        expect(screen.getByTestId("content")).toHaveTextContent("Test Data");
      });
      const preloader = container.querySelector(".preloader");
      expect(preloader).not.toBeInTheDocument();
    });

    it("renders error message when resource fails if alwaysShowContent", async () => {
      const [resource] = createResource(async () => {
        throw new Error("Test error");
      });

      const { container } = renderWithResource(
        resource,
        "Custom error message",
        true,
      );

      await waitFor(() => {
        expect(screen.getByText(/Custom error message/)).toBeInTheDocument();
      });
      expect(addNotificationMock).toHaveBeenCalledWith(
        "Custom error message: Test error",
        -1,
      );
      console.log(container.innerHTML);
    });
    function renderWithResource<T>(
      resource: Resource<T>,
      errorMessage?: string,
      alwaysShowContent?: true,
    ): {
      container: HTMLElement;
    } {
      const { container } = render(() => (
        <AsyncContent
          resource={resource}
          errorMessage={errorMessage}
          alwaysShowContent={alwaysShowContent}
        >
          {(data: T | undefined) => (
            <>
              foo
              <Show when={data !== undefined} fallback={<div>no data</div>}>
                <div data-testid="content">{String(data)}</div>
              </Show>
            </>
          )}
        </AsyncContent>
      ));

      return {
        container,
      };
    }
  });
});
