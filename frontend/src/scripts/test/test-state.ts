export let isRepeated = false;
export let isPaceRepeat = false;
export let activeChallenge: null | MonkeyTypes.Challenge = null;

export function setRepeated(tf: boolean): void {
  isRepeated = tf;
}

export function setPaceRepeat(tf: boolean): void {
  isPaceRepeat = tf;
}

export function setActiveChallenge(val: null | MonkeyTypes.Challenge): void {
  activeChallenge = val;
}
