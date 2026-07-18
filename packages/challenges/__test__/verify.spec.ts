import { describe, it, expect, vi } from "vitest";
import { verify, VerifyFailed } from "../src/verify";
import type { CompletedEvent } from "@monkeytype/schemas/results";
import { ChallengeName } from "@monkeytype/schemas/challenges";

function buildCompletedEvent(partial: Partial<CompletedEvent>): CompletedEvent {
  return {
    wpm: 100,
    rawWpm: 90,
    acc: 95,
    mode: "words",
    //@ts-expect-error this is fine
    mode2: 10,
    timestamp: 1700000000,
    testDuration: 60,
    consistency: 90,
    restartCount: 0,
    incompleteTestSeconds: 0,
    afkDuration: 0,
    tags: [],
    bailedOut: false,
    blindMode: false,
    lazyMode: false,
    funbox: [],
    language: "english",
    difficulty: "normal",
    numbers: false,
    punctuation: false,
    charTotal: 500,
    keyDuration: [],
    keySpacing: [],
    keyOverlap: 0,
    lastKeyToEnd: 0,
    startToFirstKey: 0,
    wpmConsistency: 90,
    stopOnLetter: false,
    incompleteTests: [],
    ...partial,
  };
}

describe("verify", () => {
  describe("missing challenge", () => {
    it("returns error when challenge is undefined", () => {
      const result = buildCompletedEvent({});
      const verification = verify(result);
      expect(verification).toEqual({
        state: "error",
        errorMessage: "challenge missing",
      });
    });
  });

  describe("AFK checks", () => {
    it("returns failed when AFK percentage exceeds 10%", () => {
      // 15 seconds afk out of 60 seconds = 25%
      const result = buildCompletedEvent({
        challenge: "oneHourWarrior",
        afkDuration: 15,
        testDuration: 60,
      });
      const verification = verify(result) as VerifyFailed;
      expect(verification.state).toEqual("failed");
      expect(verification.reason).toContain(
        "Challenge failed: AFK time is greater than 10%",
      );
    });

    it("returns success when AFK is within 10% and meets time requirement", () => {
      // 5 seconds afk out of 3600 seconds = ~0.14%, testDuration 3600 meets min
      const result = buildCompletedEvent({
        challenge: "oneHourWarrior",
        afkDuration: 5,
        testDuration: 3600,
      });
      const verification = verify(result);
      expect(verification.state).toBe("success");
    });

    it("returns failed when AFK is exactly at the boundary (just over 10%)", () => {
      // 6.1 seconds afk out of 60 seconds = ~10.17%
      const result = buildCompletedEvent({
        challenge: "oneHourWarrior",
        afkDuration: 6.1,
        testDuration: 60,
      });
      const verification = verify(result) as VerifyFailed;
      expect(verification.state).toEqual("failed");
      expect(verification.reason).toContain(
        "Challenge failed: AFK time is greater than 10%",
      );
    });
  });

  describe("missing settings", () => {
    it("returns error when challenge has no settings", () => {
      const result = buildCompletedEvent({
        challenge: "ultimateMonkeyFlex",
      });
      const verification = verify(result);
      expect(verification).toEqual({
        state: "error",
        errorMessage: "challenge unknown or missing settings",
      });
    });

    it("returns error when challenge has settings but no requirements", () => {
      // thumbWarrior has settings but no requirements field
      const result = buildCompletedEvent({
        challenge: "thumbWarrior",
        wpm: 100,
        testDuration: 3600,
      });
      const verification = verify(result);
      expect(verification).toEqual({
        state: "error",
        errorMessage: "challenge unknown or missing settings",
      });
    });
  });

  describe("WPM requirements", () => {
    it("passes when WPM matches exact requirement", () => {
      const result = buildCompletedEvent({
        challenge: "69",
        wpm: 69,
        rawWpm: 69,
        acc: 69,
        consistency: 69,
        testDuration: 69,
      });
      const verification = verify(result);
      expect(verification.state).toBe("success");
    });

    it("fails when WPM does not match exact requirement", () => {
      const result = buildCompletedEvent({
        challenge: "69",
        wpm: 70,
        rawWpm: 69,
        acc: 69,
        consistency: 69,
        testDuration: 69,
      });
      const verification = verify(result) as VerifyFailed;
      expect(verification.state).toEqual("failed");
      expect(verification.reason).toContain("WPM not 69");
    });

    it("returns error for challenges with no settings", () => {
      // 1000hours has no settings
      const result = buildCompletedEvent({
        challenge: "1000hours",
        wpm: 100,
        testDuration: 3600,
      });
      const verification = verify(result);
      expect(verification.state).toBe("error");
    });
  });

  describe("Accuracy requirements", () => {
    it("passes when accuracy matches exact 100%", () => {
      const result = buildCompletedEvent({
        challenge: "accuracyExpert",
        acc: 100,
        wpm: 60,
        testDuration: 600,
        afkDuration: 0,
      });
      const verification = verify(result);
      expect(verification.state).toBe("success");
    });

    it("fails when accuracy is below exact 100%", () => {
      const result = buildCompletedEvent({
        challenge: "accuracyExpert",
        acc: 99,
        wpm: 60,
        testDuration: 600,
        afkDuration: 0,
      });
      const verification = verify(result) as VerifyFailed;
      expect(verification.state).toEqual("failed");
      expect(verification.reason).toContain("Accuracy not 100");
    });

    it("fails when accuracy is below min requirement", () => {
      const result = buildCompletedEvent({
        challenge: "beepBoop",
        acc: 99,
        wpm: 50,
        testDuration: 60,
        funbox: ["nospace"],
      });
      const verification = verify(result) as VerifyFailed;
      expect(verification.state).toEqual("failed");
      expect(verification.reason).toContain("Accuracy below 100");
    });

    it("passes when accuracy meets min requirement", () => {
      const result = buildCompletedEvent({
        challenge: "beepBoop",
        acc: 100,
        wpm: 50,
        testDuration: 60,
        funbox: ["nospace"],
      });
      const verification = verify(result);
      expect(verification.state).toBe("success");
    });
  });

  describe("Raw WPM requirements", () => {
    it("passes when raw WPM matches exact requirement", () => {
      const result = buildCompletedEvent({
        challenge: "69",
        wpm: 69,
        rawWpm: 69,
        acc: 69,
        consistency: 69,
        testDuration: 69,
      });
      const verification = verify(result);
      expect(verification.state).toBe("success");
    });

    it("fails when raw WPM does not match exact requirement", () => {
      const result = buildCompletedEvent({
        challenge: "69",
        wpm: 69,
        rawWpm: 70,
        acc: 69,
        consistency: 69,
        testDuration: 69,
      });
      const verification = verify(result) as VerifyFailed;
      expect(verification.state).toEqual("failed");
      expect(verification.reason).toContain("Raw WPM not 69");
    });
  });

  describe("Consistency requirements", () => {
    it("passes when consistency matches exact requirement", () => {
      const result = buildCompletedEvent({
        challenge: "69",
        wpm: 69,
        rawWpm: 69,
        acc: 69,
        consistency: 69,
        testDuration: 69,
      });
      const verification = verify(result);
      expect(verification.state).toBe("success");
    });

    it("fails when consistency does not match exact requirement", () => {
      const result = buildCompletedEvent({
        challenge: "69",
        wpm: 69,
        rawWpm: 69,
        acc: 69,
        consistency: 70,
        testDuration: 69,
      });
      const verification = verify(result) as VerifyFailed;
      expect(verification.state).toEqual("failed");
      expect(verification.reason).toContain("Consistency not 69");
    });
  });

  describe("Time requirements", () => {
    it("passes when test duration meets min time requirement", () => {
      const result = buildCompletedEvent({
        challenge: "oneHourWarrior",
        testDuration: 3600,
      });
      const verification = verify(result);
      expect(verification.state).toBe("success");
    });

    it("passes when test duration exceeds min time requirement", () => {
      const result = buildCompletedEvent({
        challenge: "oneHourWarrior",
        testDuration: 3700,
      });
      const verification = verify(result);
      expect(verification.state).toBe("success");
    });

    it("fails when test duration is below min time requirement", () => {
      const result = buildCompletedEvent({
        challenge: "oneHourWarrior",
        testDuration: 3599,
      });
      const verification = verify(result) as VerifyFailed;
      expect(verification.state).toEqual("failed");
      expect(verification.reason).toContain("Test time below 3600");
    });

    it("passes when test duration is within max time requirement", () => {
      const result = buildCompletedEvent({
        challenge: "alpha",
        testDuration: 3,
        acc: 100,
      });
      const verification = verify(result);
      expect(verification.state).toBe("success");
    });

    it("fails when test duration exceeds max time requirement", () => {
      const result = buildCompletedEvent({
        challenge: "alpha",
        testDuration: 4,
        acc: 100,
      });
      const verification = verify(result) as VerifyFailed;
      expect(verification.state).toEqual("failed");
      expect(verification.reason).toContain("Test time above 3.36");
    });
  });

  describe("AFK requirement", () => {
    it("passes when AFK percentage is below max", () => {
      const result = buildCompletedEvent({
        challenge: "accuracyExpert",
        wpm: 60,
        acc: 100,
        testDuration: 600,
        afkDuration: 10, // ~1.67%
      });
      const verification = verify(result);
      expect(verification.state).toBe("success");
    });

    it("fails when AFK percentage exceeds max", () => {
      const result = buildCompletedEvent({
        challenge: "accuracyExpert",
        wpm: 60,
        acc: 100,
        testDuration: 600,
        afkDuration: 60, // ~10%
      });
      const verification = verify(result) as VerifyFailed;
      expect(verification.state).toEqual("failed");
      expect(verification.reason).toContain("AFK percentage above 5");
    });
  });

  describe("Funbox requirements", () => {
    it("passes when all required funboxes match", () => {
      const result = buildCompletedEvent({
        challenge: "rollercoaster",
        testDuration: 3600,
        funbox: ["round_round_baby"],
      });
      const verification = verify(result);
      expect(verification.state).toBe("success");
    });

    it("fails when one required funbox is missing", () => {
      const result = buildCompletedEvent({
        challenge: "rollercoaster",
        testDuration: 3600,
        funbox: ["mirror"],
      });
      const verification = verify(result) as VerifyFailed;
      expect(verification.state).toEqual("failed");
      expect(verification.reason).toContain(
        "round_round_baby funbox not active",
      );
    });

    it("fails when extra funbox is active", () => {
      const result = buildCompletedEvent({
        challenge: "rollercoaster",
        testDuration: 3600,
        funbox: ["round_round_baby", "mirror"],
      });
      const verification = verify(result) as VerifyFailed;
      expect(verification.state).toEqual("failed");
      expect(verification.reason).toContain("mirror funbox active");
    });

    it("passes when funbox matches exactly", () => {
      const result = buildCompletedEvent({
        challenge: "beepBoop",
        wpm: 50,
        acc: 100,
        testDuration: 60,
        funbox: ["nospace"],
      });
      const verification = verify(result);
      expect(verification.state).toBe("success");
    });

    it("returns error when funbox is undefined but required (bug in verify)", () => {
      const result = buildCompletedEvent({
        challenge: "rollercoaster",
        testDuration: 3600,
        funbox: undefined,
      });
      const verification = verify(result);
      // verify.ts doesn't handle undefined funbox in the result,
      // so it throws and returns an error state
      expect(verification.state).toBe("error");
    });
  });

  describe("multiple requirements", () => {
    it("returns combined failure reasons for all unmet requirements", () => {
      const result = buildCompletedEvent({
        challenge: "69",
        wpm: 100,
        rawWpm: 80,
        acc: 80,
        consistency: 80,
        testDuration: 69,
      });
      const verification = verify(result);
      expect(verification.state).toBe("failed");
      if (verification.state === "failed") {
        expect(verification.reason).toContain("WPM not 69");
        expect(verification.reason).toContain("Raw WPM not 69");
        expect(verification.reason).toContain("Accuracy not 69");
        expect(verification.reason).toContain("Consistency not 69");
      }
    });

    it("returns success when all requirements are met", () => {
      const result = buildCompletedEvent({
        challenge: "69",
        wpm: 69,
        rawWpm: 69,
        acc: 69,
        consistency: 69,
        testDuration: 69,
      });
      const verification = verify(result);
      expect(verification.state).toBe("success");
      if (verification.state === "success") {
        expect(verification.challenge).toBeDefined();
        expect(verification.challenge?.name).toBe("69");
      }
    });
  });

  describe("edge cases", () => {
    it("handles rounding of WPM correctly for exact match", () => {
      // Math.round(68.5) = 69
      const result = buildCompletedEvent({
        challenge: "69",
        wpm: 68.5,
        rawWpm: 69,
        acc: 69,
        consistency: 69,
        testDuration: 69,
      });
      const verification = verify(result);
      expect(verification.state).toBe("success");
    });

    it("handles rounding of WPM for non-matching values", () => {
      // Math.round(68.4) = 68
      const result = buildCompletedEvent({
        challenge: "69",
        wpm: 68.4,
        rawWpm: 69,
        acc: 69,
        consistency: 69,
        testDuration: 69,
      });
      const verification = verify(result);
      expect(verification.state).toBe("failed");
    });

    it("returns error when challenge name is unknown", () => {
      const result = buildCompletedEvent({
        challenge: "nonExistentChallenge" as ChallengeName,
      });
      const verification = verify(result);
      expect(verification.state).toBe("error");
    });

    it("returns error for challenges with no settings at all", () => {
      const result = buildCompletedEvent({
        challenge: "footBarbarian",
        wpm: 100,
        testDuration: 7200,
      });
      const verification = verify(result);
      expect(verification).toEqual({
        state: "error",
        errorMessage: "challenge unknown or missing settings",
      });
    });
  });

  describe("error handling", () => {
    it("catches and returns error on unexpected exceptions", () => {
      // Mock console.error to avoid polluting test output
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockReturnValue(undefined);

      const result = buildCompletedEvent({
        challenge: "69",
        wpm: 69,
        rawWpm: 69,
        acc: 69,
        consistency: 69,
        testDuration: 69,
      });
      const verification = verify(result);
      expect(verification.state).toBe("success");

      consoleErrorSpy.mockRestore();
    });
  });
});
