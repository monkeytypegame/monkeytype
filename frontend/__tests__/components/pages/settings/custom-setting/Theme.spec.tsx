import { cleanup, render, waitFor } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as CustomThemes from "../../../../../src/ts/collections/custom-themes";
import { Theme } from "../../../../../src/ts/components/pages/settings/custom-setting/Theme";
import { setConfigStore } from "../../../../../src/ts/config/store";
import * as CoreState from "../../../../../src/ts/states/core";
import * as SimpleModal from "../../../../../src/ts/states/simple-modal";

const { customTheme } = vi.hoisted(() => ({
  customTheme: {
    _id: "theme1",
    name: "my_theme",
    colors: [
      "#000",
      "#111",
      "#222",
      "#333",
      "#444",
      "#555",
      "#666",
      "#777",
      "#888",
      "#999",
    ],
  },
}));

vi.mock("../../../../../src/ts/collections/custom-themes", () => ({
  useCustomThemesLiveQuery: () => () => [customTheme],
  addCustomTheme: vi.fn(),
  editCustomTheme: vi.fn(),
  deleteCustomTheme: vi.fn(),
}));

vi.mock("../../../../../src/ts/utils/json-data", async (importOriginal) => ({
  ...(await importOriginal()),
  getLayout: vi.fn(async () => new Promise(() => undefined)),
}));

vi.mock("../../../../../src/ts/controllers/theme-controller", () => ({
  convertCustomColorsToTheme: (colors: string[]) => ({
    bg: colors[0],
    main: colors[1],
    sub: colors[3],
    text: colors[5],
  }),
  convertThemeToCustomColors: vi.fn(),
}));

describe("Theme setting", () => {
  const showSimpleModalMock = vi.spyOn(SimpleModal, "showSimpleModal");
  const isAuthenticatedMock = vi.spyOn(CoreState, "isAuthenticated");
  const editCustomThemeMock = vi.mocked(CustomThemes.editCustomTheme);
  const deleteCustomThemeMock = vi.mocked(CustomThemes.deleteCustomTheme);

  beforeEach(() => {
    vi.clearAllMocks();
    showSimpleModalMock.mockImplementation(() => {
      //
    });
    setConfigStore("customTheme", true);
    isAuthenticatedMock.mockReturnValue(true);
  });

  afterEach(() => {
    cleanup();
  });

  async function openModal(
    buttonIndex: 0 | 1,
  ): Promise<Parameters<typeof SimpleModal.showSimpleModal>[0]> {
    const { container } = render(() => <Theme />);
    const buttons = await waitFor(() => {
      const found = container.querySelectorAll(
        `[data-theme-id="${customTheme._id}"] button`,
      );
      expect(found).toHaveLength(2);
      return found;
    });
    (buttons[buttonIndex] as HTMLButtonElement).click();

    expect(showSimpleModalMock).toHaveBeenCalledTimes(1);
    // oxlint-disable-next-line typescript/no-non-null-assertion
    return showSimpleModalMock.mock.calls[0]![0];
  }

  describe("edit custom theme", () => {
    it("shows the error when the update fails", async () => {
      editCustomThemeMock.mockRejectedValue(
        new Error("Failed to edit custom theme: name taken"),
      );
      const modal = await openModal(0);

      const result = await modal.execFn({
        name: "new_name",
        updateColors: false,
      });

      expect(result).toEqual({
        status: "error",
        message: "Failed to edit custom theme: name taken",
      });
    });

    it("reports success once the update is saved", async () => {
      editCustomThemeMock.mockResolvedValue();
      const modal = await openModal(0);

      const result = await modal.execFn({
        name: "new_name",
        updateColors: false,
      });

      expect(editCustomThemeMock).toHaveBeenCalledWith({
        themeId: customTheme._id,
        name: "new_name",
        colors: customTheme.colors,
      });
      expect(result).toEqual({ status: "success", message: "Updated" });
    });
  });

  describe("delete custom theme", () => {
    it("shows the error when the delete fails", async () => {
      deleteCustomThemeMock.mockRejectedValue(
        new Error("Failed to delete custom theme: not found"),
      );
      const modal = await openModal(1);

      const result = await modal.execFn({});

      expect(result).toEqual({
        status: "error",
        message: "Failed to delete custom theme: not found",
      });
    });

    it("reports success once the delete is saved", async () => {
      deleteCustomThemeMock.mockResolvedValue();
      const modal = await openModal(1);

      const result = await modal.execFn({});

      expect(deleteCustomThemeMock).toHaveBeenCalledWith({
        themeId: customTheme._id,
      });
      expect(result).toEqual({
        status: "success",
        message: "Custom theme deleted",
      });
    });
  });
});
