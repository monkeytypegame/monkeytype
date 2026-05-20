import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  addNotificationWithLevel,
  showNoticeNotification,
  showSuccessNotification,
  showErrorNotification,
  removeNotification,
  clearAllNotifications,
  getNotifications,
  getNotificationHistory,
  __testing,
  AddNotificationOptions,
} from "../../src/ts/states/notifications";

const { clearNotificationHistory } = __testing;

describe("notifications store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearAllNotifications();
    clearNotificationHistory();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("addNotificationWithLevel", () => {
    it("adds a notification to the store", () => {
      addNotificationWithLevel("test message", "notice");

      const notifications = getNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0]!.message).toBe("test message");
      expect(notifications[0]!.level).toBe("notice");
    });

    it("prepends new notifications", () => {
      addNotificationWithLevel("first", "notice");
      addNotificationWithLevel("second", "success");

      const notifications = getNotifications();
      expect(notifications).toHaveLength(2);
      expect(notifications[0]!.message).toBe("second");
      expect(notifications[1]!.message).toBe("first");
    });

    it("defaults error duration to 0 (sticky)", () => {
      addNotificationWithLevel("error msg", "error");

      expect(getNotifications()[0]!.durationMs).toBe(0);
    });

    it("defaults non-error duration to 3000", () => {
      addNotificationWithLevel("notice msg", "notice");
      expect(getNotifications()[0]!.durationMs).toBe(3000);

      addNotificationWithLevel("success msg", "success");
      expect(getNotifications()[0]!.durationMs).toBe(3000);
    });

    it("respects custom durationMs", () => {
      addNotificationWithLevel("msg", "notice", { durationMs: 5000 });
      expect(getNotifications()[0]!.durationMs).toBe(5000);
    });

    it("appends response body message", () => {
      const response = {
        status: 400,
        body: { message: "Bad request" },
      } as AddNotificationOptions["response"];

      addNotificationWithLevel("Request failed", "error", { response });
      expect(getNotifications()[0]!.message).toBe(
        "Request failed: Bad request",
      );
    });

    it("appends error message via createErrorMessage", () => {
      addNotificationWithLevel("Something broke", "error", {
        error: new Error("underlying cause"),
      });
      expect(getNotifications()[0]!.message).toContain("underlying cause");
    });

    it("sets useInnerHtml when specified", () => {
      addNotificationWithLevel("html <b>bold</b>", "notice", {
        useInnerHtml: true,
      });
      expect(getNotifications()[0]!.useInnerHtml).toBe(true);
    });

    it("defaults useInnerHtml to false", () => {
      addNotificationWithLevel("plain", "notice");
      expect(getNotifications()[0]!.useInnerHtml).toBe(false);
    });

    it("sets customTitle and customIcon", () => {
      addNotificationWithLevel("msg", "notice", {
        customTitle: "Custom",
        customIcon: "gift",
      });
      const n = getNotifications()[0]!;
      expect(n.customTitle).toBe("Custom");
      expect(n.customIcon).toBe("gift");
    });
  });

  describe("auto-remove timer", () => {
    it("removes notification after durationMs + 250ms", () => {
      addNotificationWithLevel("temp", "success", { durationMs: 1000 });
      expect(getNotifications()).toHaveLength(1);

      vi.advanceTimersByTime(1249);
      expect(getNotifications()).toHaveLength(1);

      vi.advanceTimersByTime(1);
      expect(getNotifications()).toHaveLength(0);
    });

    it("does not auto-remove sticky notifications (durationMs 0)", () => {
      addNotificationWithLevel("sticky", "error");
      expect(getNotifications()[0]!.durationMs).toBe(0);

      vi.advanceTimersByTime(60000);
      expect(getNotifications()).toHaveLength(1);
    });

    it("calls onDismiss with 'timeout' when auto-removed", () => {
      const onDismiss = vi.fn();
      addNotificationWithLevel("temp", "notice", {
        durationMs: 1000,
        onDismiss,
      });

      vi.advanceTimersByTime(1250);
      expect(onDismiss).toHaveBeenCalledWith("timeout");
    });
  });

  describe("removeNotification", () => {
    it("removes a specific notification by id", () => {
      addNotificationWithLevel("first", "notice", { durationMs: 0 });
      addNotificationWithLevel("second", "notice", { durationMs: 0 });

      const id = getNotifications()[1]!.id;
      removeNotification(id);

      expect(getNotifications()).toHaveLength(1);
      expect(getNotifications()[0]!.message).toBe("second");
    });

    it("calls onDismiss with 'click' by default", () => {
      const onDismiss = vi.fn();
      addNotificationWithLevel("msg", "notice", { durationMs: 0, onDismiss });

      const id = getNotifications()[0]!.id;
      removeNotification(id);

      expect(onDismiss).toHaveBeenCalledWith("click");
    });

    it("cancels auto-remove timer on manual removal", () => {
      const onDismiss = vi.fn();
      addNotificationWithLevel("msg", "notice", {
        durationMs: 5000,
        onDismiss,
      });

      const id = getNotifications()[0]!.id;
      removeNotification(id);

      vi.advanceTimersByTime(10000);
      // onDismiss should only have been called once (the manual removal)
      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(onDismiss).toHaveBeenCalledWith("click");
    });
  });

  describe("clearAllNotifications", () => {
    it("removes all notifications", () => {
      addNotificationWithLevel("a", "notice", { durationMs: 0 });
      addNotificationWithLevel("b", "error");
      addNotificationWithLevel("c", "success", { durationMs: 0 });

      clearAllNotifications();
      expect(getNotifications()).toHaveLength(0);
    });

    it("calls onDismiss with 'clear' for each notification", () => {
      const onDismiss1 = vi.fn();
      const onDismiss2 = vi.fn();
      addNotificationWithLevel("a", "notice", {
        durationMs: 0,
        onDismiss: onDismiss1,
      });
      addNotificationWithLevel("b", "notice", {
        durationMs: 0,
        onDismiss: onDismiss2,
      });

      clearAllNotifications();
      expect(onDismiss1).toHaveBeenCalledWith("clear");
      expect(onDismiss2).toHaveBeenCalledWith("clear");
    });

    it("store is empty when onDismiss callbacks run", () => {
      let countDuringCallback = -1;
      addNotificationWithLevel("a", "notice", {
        durationMs: 0,
        onDismiss: () => {
          countDuringCallback = getNotifications().length;
        },
      });

      clearAllNotifications();
      expect(countDuringCallback).toBe(0);
    });

    it("cancels all pending auto-remove timers", () => {
      const onDismiss = vi.fn();
      addNotificationWithLevel("a", "notice", {
        durationMs: 2000,
        onDismiss,
      });
      addNotificationWithLevel("b", "notice", {
        durationMs: 3000,
        onDismiss,
      });

      clearAllNotifications();
      vi.advanceTimersByTime(10000);

      // onDismiss called twice from clearAll, never from timers
      expect(onDismiss).toHaveBeenCalledTimes(2);
      expect(onDismiss).toHaveBeenCalledWith("clear");
    });

    it("does not throw if onDismiss throws", () => {
      addNotificationWithLevel("a", "notice", {
        durationMs: 0,
        onDismiss: () => {
          throw new Error("callback error");
        },
      });
      addNotificationWithLevel("b", "notice", { durationMs: 0 });

      expect(() => clearAllNotifications()).not.toThrow();
      expect(getNotifications()).toHaveLength(0);
    });
  });

  describe("convenience functions", () => {
    it("showNoticeNotification adds notice level", () => {
      showNoticeNotification("notice msg");
      expect(getNotifications()[0]!.level).toBe("notice");
    });

    it("showSuccessNotification adds success level", () => {
      showSuccessNotification("success msg");
      expect(getNotifications()[0]!.level).toBe("success");
    });

    it("showErrorNotification adds error level", () => {
      showErrorNotification("error msg");
      expect(getNotifications()[0]!.level).toBe("error");
    });
  });

  describe("notification history", () => {
    it("adds entries to history", () => {
      addNotificationWithLevel("msg", "success");

      const history = getNotificationHistory();
      expect(history).toHaveLength(1);
      expect(history[0]!.message).toBe("msg");
      expect(history[0]!.level).toBe("success");
      expect(history[0]!.title).toBe("Success");
    });

    it("uses correct default titles", () => {
      addNotificationWithLevel("a", "success");
      addNotificationWithLevel("b", "error");
      addNotificationWithLevel("c", "notice");

      const history = getNotificationHistory();
      expect(history[0]!.title).toBe("Success");
      expect(history[1]!.title).toBe("Error");
      expect(history[2]!.title).toBe("Notice");
    });

    it("uses customTitle in history when provided", () => {
      addNotificationWithLevel("msg", "notice", { customTitle: "Reward" });
      expect(getNotificationHistory()[0]!.title).toBe("Reward");
    });

    it("stores details in history", () => {
      addNotificationWithLevel("msg", "notice", {
        details: { foo: "bar" },
      });
      expect(getNotificationHistory()[0]!.details).toEqual({ foo: "bar" });
    });

    it("caps history at 25 entries", () => {
      for (let i = 0; i < 30; i++) {
        addNotificationWithLevel(`msg ${i}`, "notice");
      }

      const history = getNotificationHistory();
      expect(history).toHaveLength(25);
      expect(history[0]!.message).toBe("msg 5");
      expect(history[24]!.message).toBe("msg 29");
    });

    it("is not affected by clearAllNotifications", () => {
      addNotificationWithLevel("msg", "notice", { durationMs: 0 });
      clearAllNotifications();

      expect(getNotificationHistory()).toHaveLength(1);
    });
  });
});
