// code for "generateStep" is from Mirin's "Queue" modfile,
// converted from lua to typescript by Spax
// lineout: https://youtu.be/LnnArS9yrSs
let footTrack = false;
let currFacing = 0;
let facingCount = 0;
let lastLeftStep = 0,
  lastRightStep = 3,
  leftStepCount = 0,
  rightStepCount = 0;
function generateStep(leftRightOverride: boolean): number {
  facingCount--;
  let randomStep = Math.round(Math.random());
  let stepValue = Math.round(Math.random() * 5 - 0.5);
  if (leftRightOverride) {
    footTrack = Boolean(Math.round(Math.random()));
    if (footTrack) stepValue = 3;
    else stepValue = 0;
  } else {
    //right foot
    if (footTrack) {
      if (lastLeftStep === randomStep) leftStepCount++;
      else leftStepCount = 0;
      if (leftStepCount > 1 || (rightStepCount > 0 && leftStepCount > 0)) {
        randomStep = 1 - randomStep;
        leftStepCount = 0;
      }
      lastLeftStep = randomStep;
      stepValue = randomStep * (currFacing + 1);
      //left foot
    } else {
      if (lastRightStep === randomStep) rightStepCount++;
      else rightStepCount = 0;
      if (rightStepCount > 1 || (rightStepCount > 0 && leftStepCount > 0)) {
        randomStep = 1 - randomStep;
        rightStepCount = 0;
      }
      lastRightStep = randomStep;
      stepValue = 3 - randomStep * (currFacing + 1);
    }
    //alternation
    footTrack = !footTrack;

    if (facingCount < 0 && randomStep === 0) {
      currFacing = 1 - currFacing;
      facingCount = Math.floor(Math.random() * 3) + 3;
    }
  }

  return stepValue;
}

export function chart2Word(first: boolean): string {
  const arrowArray = ["←", "↓", "↑", "→"];
  let measure = "";
  for (let i = 0; i < 4; i++) {
    measure += arrowArray[generateStep(i === 0 && first)];
  }

  return measure;
}
