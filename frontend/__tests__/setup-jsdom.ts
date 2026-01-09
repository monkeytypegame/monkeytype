import $ from "jquery";
import { vi } from "vitest";
import "@testing-library/jest-dom";
import { getDefaultConfig } from "../src/ts/constants/default-config";

//@ts-expect-error add to global
global["$"] = $;
//@ts-expect-error add to global
global["jQuery"] = $;

vi.mock("../src/ts/config", () => {
  return {
    default: getDefaultConfig(),
  };
});

vi.mock("../src/ts/test/focus", () => {
  return {
    isFocused: vi.fn(),
  };
});
