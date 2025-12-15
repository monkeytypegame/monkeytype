import { vi } from "vitest";
import $ from "jquery";
import { ElementWithUtils } from "../src/ts/utils/dom";

//@ts-expect-error add to globl
global["$"] = $;
//@ts-expect-error add to globl
global["jQuery"] = $;

vi.mock("../src/ts/constants/env-config", () => ({
  envConfig: {
    backendUrl: "invalid",
    isDevelopment: true,
  },
}));

vi.mock("../src/ts/firebase", () => ({
  app: undefined,
  Auth: undefined,
  isAuthenticated: () => false,
}));

vi.mock("../src/ts/utils/dom", () => {
  const createMockElement = (): ElementWithUtils => {
    return {
      disable: vi.fn().mockReturnThis(),
      enable: vi.fn().mockReturnThis(),
      isDisabled: vi.fn().mockReturnValue(false),
      getAttribute: vi.fn(),
      hasAttribute: vi.fn().mockReturnValue(false),
      setAttribute: vi.fn().mockReturnThis(),
      removeAttribute: vi.fn().mockReturnThis(),
      isChecked: vi.fn().mockReturnValue(false),
      hide: vi.fn().mockReturnThis(),
      show: vi.fn().mockReturnThis(),
      addClass: vi.fn().mockReturnThis(),
      removeClass: vi.fn().mockReturnThis(),
      hasClass: vi.fn().mockReturnValue(false),
      toggleClass: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      onChild: vi.fn().mockReturnThis(),
      setHtml: vi.fn().mockReturnThis(),
      setText: vi.fn().mockReturnThis(),
      remove: vi.fn(),
      setStyle: vi.fn().mockReturnThis(),
      getStyle: vi.fn().mockReturnValue({}),
      isFocused: vi.fn().mockReturnValue(false),
      qs: vi.fn().mockReturnValue(null),
      qsr: vi.fn().mockImplementation(() => createMockElement()),
      qsa: vi.fn().mockReturnValue([]),
      empty: vi.fn().mockReturnThis(),
      appendHtml: vi.fn().mockReturnThis(),
      append: vi.fn().mockReturnThis(),
      prependHtml: vi.fn().mockReturnThis(),
      dispatch: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnValue({ top: 0, left: 0 }),
      wrapWith: vi.fn().mockImplementation(() => createMockElement()),
      setValue: vi.fn().mockReturnThis(),
      getValue: vi.fn().mockReturnValue(""),
      getParent: vi.fn().mockImplementation(() => createMockElement()),
      replaceWith: vi.fn().mockReturnThis(),
      getOffsetWidth: vi.fn().mockReturnValue(0),
      getOffsetHeight: vi.fn().mockReturnValue(0),
      getOffsetTop: vi.fn().mockReturnValue(0),
      getOffsetLeft: vi.fn().mockReturnValue(0),
      animate: vi.fn().mockResolvedValue(null),
      promiseAnimate: vi.fn().mockResolvedValue(null),
      native: document.createElement("div"),
    };
  };

  return {
    qsr: vi.fn().mockImplementation(() => createMockElement()),
    qs: vi.fn().mockImplementation(() => createMockElement()),
    qsa: vi.fn().mockReturnValue([]),
  };
});

// Mock document.querySelector to return a div
// oxlint-disable-next-line no-deprecated
global.document.querySelector = vi
  .fn()
  .mockReturnValue(document.createElement("div"));
