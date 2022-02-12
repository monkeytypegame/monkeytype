export let isRepeated = false;
export let isPaceRepeat = false;
export let activeChallenge = null;

export function setRepeated(tf) {
  isRepeated = tf;
}

export function setPaceRepeat(tf) {
  isPaceRepeat = tf;
}

export function setActiveChallenge(val) {
  activeChallenge = val;
}
