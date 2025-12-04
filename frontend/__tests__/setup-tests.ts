import { vi } from "vitest";
import $ from "jquery";
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
  const createMockElement = (): any => {
    const mock = {
      qsr: vi.fn(),
      qs: vi.fn().mockReturnValue(null),
      find: vi.fn(),
      addClass: vi.fn(),
      removeClass: vi.fn(),
      hide: vi.fn(),
      show: vi.fn(),
      setText: vi.fn(),
      prependHtml: vi.fn(),
      empty: vi.fn(),
      appendHtml: vi.fn(),
      native: document.createElement("div"),
    };

    // Make chainable methods return the mock itself
    mock.qsr.mockImplementation(() => createMockElement());
    mock.addClass.mockReturnValue(mock);
    mock.removeClass.mockReturnValue(mock);
    mock.hide.mockReturnValue(mock);
    mock.show.mockReturnValue(mock);
    mock.setText.mockReturnValue(mock);
    mock.prependHtml.mockReturnValue(mock);
    mock.empty.mockReturnValue(mock);

    return mock;
  };

  return {
    qsr: vi.fn().mockImplementation(() => createMockElement()),
    qs: vi.fn().mockImplementation(() => createMockElement()),
    qsa: vi.fn().mockReturnValue([]),
  };
});

// Mock document.querySelector to return a div
global.document.querySelector = vi
  .fn()
  .mockReturnValue(document.createElement("div"));
