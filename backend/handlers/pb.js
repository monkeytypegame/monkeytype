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
    mode,
    mode2,
    acc,
    consistency,
    difficulty,
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
        language,
        punctuation,
        raw,
        wpm,
        timestamp: Date.now(),
      });
    }

    let lbPb;
    if (isPb && mode === "time" && (mode2 == "15" || mode2 == "60")) {
      lbPb = {
        time: {
          15: {},
          60: {},
        },
      };
      let bestForEveryLanguage = {};
      if (obj?.time?.[15]) {
        obj.time[15].forEach((pb) => {
          if (!bestForEveryLanguage[pb.language]) {
            bestForEveryLanguage[pb.language] = pb;
          } else {
            if (bestForEveryLanguage[pb.language].wpm < pb.wpm) {
              bestForEveryLanguage[pb.language] = pb;
            }
          }
        });
        Object.keys(bestForEveryLanguage).forEach((key) => {
          lbPb.time[15][key] = bestForEveryLanguage[key];
        });
        bestForEveryLanguage = {};
      }
      if (obj?.time?.[60]) {
        obj.time[60].forEach((pb) => {
          if (!bestForEveryLanguage[pb.language]) {
            bestForEveryLanguage[pb.language] = pb;
          } else {
            if (bestForEveryLanguage[pb.language].wpm < pb.wpm) {
              bestForEveryLanguage[pb.language] = pb;
            }
          }
        });
        Object.keys(bestForEveryLanguage).forEach((key) => {
          lbPb.time[60][key] = bestForEveryLanguage[key];
        });
      }
    }

    return {
      isPb,
      obj,
      lbPb,
    };
  },
};
