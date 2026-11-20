import { describe, expect, it } from "vitest";

import {
  BOARD_POSE_DEFAULT,
  BOARD_POSE_LIMITS,
  clampBoardPose,
} from "../../../../src/ts/components/pages/test/Keymap3D";

describe("board pose", () => {
  it("has the agreed default pose", () => {
    expect(BOARD_POSE_DEFAULT).toEqual({ tilt: 55, rake: -5 });
  });

  it.each([
    {
      name: "in range",
      input: { tilt: 45, rake: 10 },
      expected: { tilt: 45, rake: 10 },
    },
    {
      name: "tilt above max",
      input: { tilt: 95, rake: 0 },
      expected: { tilt: 80, rake: 0 },
    },
    {
      name: "tilt below min",
      input: { tilt: 5, rake: 0 },
      expected: { tilt: 20, rake: 0 },
    },
    {
      name: "rake above max",
      input: { tilt: 50, rake: 40 },
      expected: { tilt: 50, rake: 30 },
    },
    {
      name: "rake below min",
      input: { tilt: 50, rake: -40 },
      expected: { tilt: 50, rake: -30 },
    },
    {
      name: "both out of range",
      input: { tilt: 100, rake: -100 },
      expected: { tilt: 80, rake: -30 },
    },
  ])("clamps $name", ({ input, expected }) => {
    expect(clampBoardPose(input)).toEqual(expected);
  });

  it("declares the clamped orbit range", () => {
    expect(BOARD_POSE_LIMITS).toEqual({
      tilt: [20, 80],
      rake: [-30, 30],
    });
  });
});
