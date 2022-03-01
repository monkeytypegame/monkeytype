export let authDone: (value?: unknown) => void;
export let authCompleted = false;

export const authPromise = new Promise((v) => {
  authDone = v;
}).then(() => {
  authCompleted = true;
});
