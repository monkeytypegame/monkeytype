#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Script to automatically replace common jQuery patterns with vanilla JavaScript.
 * This script handles non-animation jQuery calls only.
 *
 * Patterns to KEEP (animations):
 * - .animate()
 * - .fadeIn(), .fadeOut()
 * - .slideDown(), .slideUp()
 * - .stop()
 */

const fs = require("fs");
const path = require("path");
const { glob } = require("glob");

// Patterns that indicate animation - we should NOT replace lines containing these
const ANIMATION_PATTERNS = [
  ".animate(",
  ".fadeIn(",
  ".fadeOut(",
  ".slideDown(",
  ".slideUp(",
  ".slideToggle(",
  ".stop(",
  ".show(",
  ".hide(",
];

function isAnimationLine(line) {
  return ANIMATION_PATTERNS.some((pattern) => line.includes(pattern));
}

function replaceJQueryPatterns(content) {
  const lines = content.split("\n");
  const replacedLines = lines.map((line) => {
    // Skip lines that contain animations
    if (isAnimationLine(line)) {
      return line;
    }

    let replaced = line;

    // Pattern: $(document).on("event", handler) -> document.addEventListener("event", handler)
    replaced = replaced.replace(
      /\$\(document\)\.on\((['"])([^'"]+)\1,\s*(\([^)]*\)\s*=>)/g,
      "document.addEventListener($1$2$1, $3"
    );

    replaced = replaced.replace(
      /\$\(document\)\.on\((['"])([^'"]+)\1,\s*(function\s*\([^)]*\))/g,
      "document.addEventListener($1$2$1, $3"
    );

    // Pattern: $(window).on("event", handler) -> window.addEventListener("event", handler)
    replaced = replaced.replace(
      /\$\(window\)\.on\((['"])([^'"]+)\1,\s*(\([^)]*\)\s*=>)/g,
      "window.addEventListener($1$2$1, $3"
    );

    replaced = replaced.replace(
      /\$\(window\)\.on\((['"])([^'"]+)\1,\s*(function\s*\([^)]*\))/g,
      "window.addEventListener($1$2$1, $3"
    );

    // Pattern: $("selector").on("event", handler) -> needs manual review, but can suggest
    // These are more complex due to event delegation

    // Pattern: .addClass("class") -> .classList.add("class")
    replaced = replaced.replace(
      /\.addClass\((['"])([^'"]+)\1\)/g,
      ".classList.add($1$2$1)"
    );

    // Pattern: .removeClass("class") -> .classList.remove("class")
    replaced = replaced.replace(
      /\.removeClass\((['"])([^'"]+)\1\)/g,
      ".classList.remove($1$2$1)"
    );

    // Pattern: .toggleClass("class") -> .classList.toggle("class")
    replaced = replaced.replace(
      /\.toggleClass\((['"])([^'"]+)\1\)/g,
      ".classList.toggle($1$2$1)"
    );

    // Pattern: .hasClass("class") -> .classList.contains("class")
    replaced = replaced.replace(
      /\.hasClass\((['"])([^'"]+)\1\)/g,
      ".classList.contains($1$2$1)"
    );

    // Pattern: .text(value) -> .textContent = value (requires manual review)
    // Pattern: .html(value) -> .innerHTML = value (requires manual review)
    // Pattern: .val() -> .value (requires manual review)
    // These are context-dependent and need careful manual replacement

    // Pattern: .attr("name", "value") -> .setAttribute("name", "value")
    replaced = replaced.replace(
      /\.attr\((['"])([^'"]+)\1,\s*(['"])\)/g,
      ".setAttribute($1$2$1, $3"
    );

    // Pattern: .prop("property", value) -> direct property access (complex, skip for now)

    // Pattern: .append(html) -> .insertAdjacentHTML("beforeend", html)
    // Complex pattern, needs manual review

    // Pattern: .empty() -> .innerHTML = ""
    replaced = replaced.replace(/\.empty\(\)/g, '.innerHTML = ""');

    // Pattern: .remove() -> .remove() (same in vanilla JS!)

    return replaced;
  });

  return replacedLines.join("\n");
}

async function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const originalContent = content;

    // Apply replacements
    const newContent = replaceJQueryPatterns(content);

    // Only write if something changed
    if (newContent !== originalContent) {
      fs.writeFileSync(filePath, newContent, "utf8");
      console.log(`✓ Processed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  const srcDir = path.join(__dirname, "..", "src", "ts");

  // Find all TypeScript files
  const files = await glob("**/*.ts", {
    cwd: srcDir,
    absolute: true,
    ignore: ["**/*.d.ts", "**/*.spec.ts", "**/__tests__/**"],
  });

  console.log(`Found ${files.length} TypeScript files to process...\n`);

  let processedCount = 0;
  for (const file of files) {
    const wasModified = await processFile(file);
    if (wasModified) {
      processedCount++;
    }
  }

  console.log(`\n✓ Complete! Modified ${processedCount} files.`);
  console.log(
    "\nNote: Many patterns require manual review. Please check the changes carefully."
  );
  console.log(
    "Animation-related jQuery calls (.animate, .fadeIn, etc.) were preserved."
  );
}

main().catch(console.error);
