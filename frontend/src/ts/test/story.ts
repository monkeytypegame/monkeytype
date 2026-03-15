import {
  type Story,
  type StoryLength,
  type StoryFile,
  StoryFileSchema,
} from "@monkeytype/schemas/stories";
import {
  showErrorNotification,
  showNoticeNotification,
} from "../stores/notifications";
import config from "../config";

// State
let currentStory: Story | null = null;
let currentWordList: string[] = [];
let storyCache: Map<string, StoryFile> = new Map();

// Paragraph count per tier
const STORY_LENGTH_PARAGRAPH_MAP: Record<StoryLength, number> = {
  flash: 1,
  short: 3,
  epic: 7,
};

// Loaders. Loads the story JSON for a given language. Caches the result so we don't re-fetch on every test restart.
async function loadStoryFile(language: string): Promise<StoryFile | null> {
  if (storyCache.has(language)) {
    return storyCache.get(language) as StoryFile;
  }

  try {
    const response = await fetch(`/static/stories/${language}.json`);
    if (!response.ok) {
      // Fallback to english if language-specific file not found
      if (language !== "english") {
        showErrorNotification(
          `[story] No story file for "${language}", falling back to English`,
        );
        return await loadStoryFile("english");
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const raw: unknown = await response.json();
    const parsed = StoryFileSchema.safeParse(raw);

    if (!parsed.success) {
      showErrorNotification("Failed to load story content");
      return null;
    }
    storyCache.set(language, parsed.data);
    return parsed.data;
  } catch (err) {
    showErrorNotification("Failed to load story content");
    return null;
  }
}

// Story Picker - Picks a random story that matches the configured storyLength tier. Avoids repeating the same story twice in a row.
function pickStory(stories: Story[], length: StoryLength): Story | null {
  const matching = stories.filter((s) => s.length === length);

  if (matching.length === 0) {
    showNoticeNotification(
      `[story] No stories found for length tier: ${length}`,
    );
    return null;
  }

  if (matching.length === 1) return matching[0] as Story;

  // Avoid repeating the last story
  const pool = currentStory
    ? matching.filter((s) => s.id !== currentStory?.id)
    : matching;

  const index = Math.floor(Math.random() * pool.length);
  return pool[index] as Story;
}

// Word List Builder
function buildWordList(story: Story, maxParagraphs: number): string[] {
  const paragraphs = story.paragraphs.slice(0, maxParagraphs);
  const fullText = paragraphs.join(" ");

  return fullText
    .split(" ")
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
}

// Initializes a new story test.
export async function initStory(): Promise<string[] | null> {
  const language = config.language ?? "english";
  const storyLength = config.storyLength ?? "flash";

  const file = await loadStoryFile(language);
  if (!file) return null;

  const story = pickStory(file.stories, storyLength);
  if (!story) {
    showErrorNotification(`No stories available for length: ${storyLength}`);
    return null;
  }

  currentStory = story;

  const maxParagraphs = STORY_LENGTH_PARAGRAPH_MAP[storyLength];
  currentWordList = buildWordList(story, maxParagraphs);

  console.log(
    `[story] Loaded: "${story.title}" | tier: ${storyLength} | words: ${currentWordList.length}`,
  );

  return currentWordList;
}

//Returns the currently active story (useful for result display).
export function getCurrentStory(): Story | null {
  return currentStory;
}

//Returns the current word list (used by the test engine).
export function getCurrentWordList(): string[] {
  return currentWordList;
}

//Returns the display title for the active story, or empty string.
export function getStoryTitle(): string {
  return currentStory?.title ?? "";
}

//Clears state — call this on test reset.
export function reset(): void {
  currentStory = null;
  currentWordList = [];
}
