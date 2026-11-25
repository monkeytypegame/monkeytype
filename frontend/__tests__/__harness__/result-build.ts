// holdResult(): the engine's result build waits until releaseResult().
// Shared by setup-test-page's after-paint mock and the harness
export const resultBuild = {
  held: false,
  waiting: [] as (() => void)[],
};
