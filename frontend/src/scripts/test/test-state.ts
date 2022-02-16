export let isRepeated = false;
export let isPaceRepeat = false;
export let activeChallenge: null | string = null;

export function setRepeated(tf: boolean): void {
  isRepeated = tf;
}

export function setPaceRepeat(tf: boolean): void {
  isPaceRepeat = tf;
}

export function setActiveChallenge(val: null | string): void {
  activeChallenge = val;
}
