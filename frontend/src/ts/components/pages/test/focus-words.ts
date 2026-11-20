import { createEvent } from "../../../hooks/createEvent";

/**
 * Focuses the words input (WordsInput), then brings the test into view: the
 * active line during a test (Words), the test block before it (TestPage).
 * `force` blurs first. Dispatched by TestPage (the restart's swap, the words
 * wrapper click) and WordsInput (autofocus).
 */
export const focusWordsEvent = createEvent<{ force: boolean }>();
