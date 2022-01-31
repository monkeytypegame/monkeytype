/*


obj structure

time: {
  10: [ - this is a list because there can be
    different personal bests for different difficulties, languages and punctuation
    {
      acc,
      consistency,
      difficulty,
      language,
      punctuation,
      raw,
      timestamp,
      wpm
    }
  ]
},
words: {
  10: [
    {}
  ]
},
zen: {
  zen: [
    {}
  ]
},
custom: {
  custom: {
    []
  }
}





*/

module.exports = {
  checkAndUpdatePb(
    obj,
    lbObj,
    mode,
    mode2,
    acc,
    consistency,
    difficulty,
    lazyMode = false,
    language,
    punctuation,
    raw,
    wpm
  ) {
    //verify structure first
    if (obj === undefined) obj = {};
    if (obj[mode] === undefined) obj[mode] = {};
    if (obj[mode][mode2] === undefined) obj[mode][mode2] = [];

    let isPb = false;
    let found = false;
    //find a pb
    obj[mode][mode2].forEach((pb) => {
      //check if we should compare first
      if (
        (pb.lazyMode === lazyMode ||
          (pb.lazyMode === undefined && lazyMode === false)) &&
        pb.difficulty === difficulty &&
        pb.language === language &&
        pb.punctuation === punctuation
      ) {
        found = true;
        //compare
        if (pb.wpm < wpm) {
          //update
          isPb = true;
          pb.acc = acc;
          pb.consistency = consistency;
          pb.difficulty = difficulty;
          pb.language = language;
          pb.punctuation = punctuation;
          pb.lazyMode = lazyMode;
          pb.raw = raw;
          pb.wpm = wpm;
          pb.timestamp = Date.now();
        }
      }
    });
    //if not found push a new one
    if (!found) {
      isPb = true;
      obj[mode][mode2].push({
        acc,
        consistency,
        difficulty,
        lazyMode,
        language,
        punctuation,
        raw,
        wpm,
        timestamp: Date.now(),
      });
    }

    if (
      lbObj &&
      mode === "time" &&
      (mode2 == "15" || mode2 == "60") &&
      !lazyMode
    ) {
      //updating lbpersonalbests object
      //verify structure first
      if (lbObj[mode] === undefined) lbObj[mode] = {};
      if (lbObj[mode][mode2] === undefined || Array.isArray(lbObj[mode][mode2]))
        lbObj[mode][mode2] = {};

      let bestForEveryLanguage = {};
      if (obj?.[mode]?.[mode2]) {
        obj[mode][mode2].forEach((pb) => {
          if (!bestForEveryLanguage[pb.language]) {
            bestForEveryLanguage[pb.language] = pb;
          } else {
            if (bestForEveryLanguage[pb.language].wpm < pb.wpm) {
              bestForEveryLanguage[pb.language] = pb;
            }
          }
        });
        Object.keys(bestForEveryLanguage).forEach((key) => {
          if (lbObj[mode][mode2][key] === undefined) {
            lbObj[mode][mode2][key] = bestForEveryLanguage[key];
          } else {
            if (lbObj[mode][mode2][key].wpm < bestForEveryLanguage[key].wpm) {
              lbObj[mode][mode2][key] = bestForEveryLanguage[key];
            }
          }
        });
        bestForEveryLanguage = {};
      }
    }

    return {
      isPb,
      obj,
      lbObj,
    };
  },
};
