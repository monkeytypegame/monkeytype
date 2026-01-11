import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@solidjs/testing-library";
import { createResource, Resource } from "solid-js";
import AsyncContent from "../../src/ts/components/AsyncContent";

describe("AsyncContent", () => {
  function renderWithResource<T>(
    resource: Resource<T>,
    errorMessage?: string,
  ): {
    container: HTMLElement;
  } {
    const { container } = render(() => (
      <AsyncContent resource={resource} errorMessage={errorMessage}>
        {(data) => <div data-testid="content">{String(data)}</div>}
      </AsyncContent>
    ));

    return {
      container,
    };
  }

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
  });

  it("renders default error message when no custom message provided", async () => {
    const [resource] = createResource(async () => {
      throw new Error("Test error");
    });

    renderWithResource(resource);

    await waitFor(() => {
      expect(screen.getByText(/An error occurred/)).toBeInTheDocument();
    });
  });
});
