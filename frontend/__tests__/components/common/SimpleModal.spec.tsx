import { fireEvent, render, waitFor } from "@solidjs/testing-library";
import { ParentProps } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import Ape from "../../../src/ts/ape";
import { showUpdateNameModal } from "../../../src/ts/components/modals/account-settings/UpdateNameModal";
import { SimpleModal } from "../../../src/ts/components/modals/SimpleModal";
import {
  clearAllNotifications,
  getNotifications,
  showErrorNotification,
} from "../../../src/ts/states/notifications";

vi.mock("../../../src/ts/ape", () => ({
  default: {
    users: {
      getNameAvailability: vi.fn(async () => ({
        status: 200,
        body: { data: { available: true } },
      })),
      updateName: vi.fn(async () => ({
        status: 409,
        body: { message: "Username unavailable" },
      })),
    },
  },
}));

vi.mock("../../../src/ts/auth", () => ({
  getPasswordSchema: () => z.string().optional(),
  isUsingPasswordAuthentication: () => false,
  reauthenticate: vi.fn(async () => ({ status: "success" })),
}));

vi.mock("../../../src/ts/db", () => ({
  getSnapshot: () => ({ name: "oldName" }),
  setSnapshot: vi.fn(),
}));

vi.mock("../../../src/ts/states/core", () => ({
  isAuthenticated: () => true,
}));

vi.mock("../../../src/ts/components/common/AnimatedModal", () => ({
  AnimatedModal: (props: ParentProps & { beforeShow?: () => void }) => {
    props.beforeShow?.();
    return <div>{props.children}</div>;
  },
}));

vi.mock("../../../src/ts/states/modals", () => ({
  showModal: vi.fn(),
  hideModal: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  clearAllNotifications();
});

describe("username update errors", () => {
  it("clears the previous failure when retrying without clearing unrelated errors", async () => {
    const unrelatedId = showErrorNotification("Unrelated error");
    showUpdateNameModal();
    const { container, getByPlaceholderText } = render(() => <SimpleModal />);
    const form = container.querySelector("form");
    if (form === null) throw new Error("Missing form");

    fireEvent.input(getByPlaceholderText("new name"), {
      target: { value: "takenName" },
    });
    await waitFor(
      () => expect(Ape.users.getNameAvailability).toHaveBeenCalled(),
      {
        timeout: 2000,
      },
    );

    for (let attempt = 1; attempt <= 3; attempt++) {
      fireEvent.submit(form);
      await waitFor(
        () => expect(Ape.users.updateName).toHaveBeenCalledTimes(attempt),
        {
          timeout: 2000,
        },
      );
      await waitFor(() => {
        expect(getNotifications()).toHaveLength(2);
        expect(getNotifications().some((it) => it.id === unrelatedId)).toBe(
          true,
        );
        expect(getNotifications()[0]?.message).toBe(
          "Failed to update name: Username unavailable",
        );
      });
    }
  });

  it("does not remove stale error from a previous modal instance", async () => {
    showUpdateNameModal();
    const first = render(() => <SimpleModal />);
    const firstForm = first.container.querySelector("form");
    if (firstForm === null) throw new Error("Missing form");

    fireEvent.input(first.getByPlaceholderText("new name"), {
      target: { value: "takenName" },
    });
    fireEvent.submit(firstForm);
    await waitFor(() => expect(Ape.users.updateName).toHaveBeenCalledTimes(1), {
      timeout: 2000,
    });
    await waitFor(() => expect(getNotifications()).toHaveLength(1));
    first.unmount();

    showUpdateNameModal();
    const second = render(() => <SimpleModal />);
    const secondForm = second.container.querySelector("form");
    if (secondForm === null) throw new Error("Missing form");

    fireEvent.input(second.getByPlaceholderText("new name"), {
      target: { value: "takenName2" },
    });
    fireEvent.submit(secondForm);
    await waitFor(() => expect(Ape.users.updateName).toHaveBeenCalledTimes(2), {
      timeout: 2000,
    });

    expect(getNotifications()).toHaveLength(2);
    expect(getNotifications()[0]?.message).toBe(
      "Failed to update name: Username unavailable",
    );
  });
});
