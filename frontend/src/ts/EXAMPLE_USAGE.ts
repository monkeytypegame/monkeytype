/**
 * Example usage and test cases for the Potential WPM feature
 * This file demonstrates how the swap detection works
 */

import { isSingleSwapError } from "./utils/swap-detection";

// Test cases demonstrating swap detection
console.log("=== Swap Detection Test Cases ===\n");

// ✅ Valid swap errors (should return true)
console.log("Valid swaps:");
console.log(
  'isSingleSwapError("tpye", "type"):',
  isSingleSwapError("tpye", "type")
); // true - p and y swapped
console.log(
  'isSingleSwapError("hte", "the"):',
  isSingleSwapError("hte", "the")
); // true - h and t swapped
console.log(
  'isSingleSwapError("wrod", "word"):',
  isSingleSwapError("wrod", "word")
); // true - r and o swapped
console.log(
  'isSingleSwapError("recieve", "receive"):',
  isSingleSwapError("recieve", "receive")
); // true - i and e swapped

// ❌ Invalid errors (should return false)
console.log("\nNot swaps:");
console.log(
  'isSingleSwapError("tpe", "type"):',
  isSingleSwapError("tpe", "type")
); // false - missing character
console.log(
  'isSingleSwapError("typo", "type"):',
  isSingleSwapError("typo", "type")
); // false - wrong character
console.log(
  'isSingleSwapError("teyp", "type"):',
  isSingleSwapError("teyp", "type")
); // false - multiple swaps
console.log(
  'isSingleSwapError("ytpe", "type"):',
  isSingleSwapError("ytpe", "type")
); // false - multiple differences
console.log(
  'isSingleSwapError("types", "type"):',
  isSingleSwapError("types", "type")
); // false - different length
console.log(
  'isSingleSwapError("type", "type"):',
  isSingleSwapError("type", "type")
); // false - identical

// Example WPM calculation scenario
console.log("\n=== Example WPM Calculation ===\n");

const testScenario = {
  words: ["the", "quick", "brown", "fox"],
  typed: ["hte", "quick", "brown", "fox"], // "hte" is a swap error
  testDuration: 5, // seconds
  correctChars: 15, // chars in "quick brown fox"
  swapErrors: 1, // "hte"
  correctSpaces: 3,
};

// Regular WPM calculation
const regularWpm =
  ((testScenario.correctChars + testScenario.correctSpaces) * 60) /
  testScenario.testDuration /
  5;
console.log("Regular WPM:", regularWpm.toFixed(2));

// Potential WPM calculation (treating swap as correct)
const swapErrorChars = testScenario.swapErrors * 2; // 2 chars were wrong due to swap
const potentialCorrectChars = testScenario.correctChars + swapErrorChars;
const potentialWpm =
  ((potentialCorrectChars + testScenario.correctSpaces) * 60) /
  testScenario.testDuration /
  5;
console.log("Potential WPM:", potentialWpm.toFixed(2));
console.log("Difference:", (potentialWpm - regularWpm).toFixed(2), "wpm");

console.log("\n=== Feature Usage ===");
console.log("After completing a test with swap errors:");
console.log("- Main WPM displays normally");
console.log("- Hover over WPM to see potential WPM");
console.log(
  "- Tooltip shows: 'Potential WPM: X.XX wpm (ignoring N swap error[s])'"
);
