// module.exports = {
//   check(result, userdata) {
//     let pbs = null;
//     if (result.mode == "quote") {
//       return false;
//     }
//     if (result.funbox !== "none") {
//       return false;
//     }

//     pbs = userdata?.personalBests;
//     if(pbs === undefined){
//       //userdao set personal best
//       return true;
//     }

//     // try {
//     //   pbs = userdata.personalBests;
//     //   if (pbs === undefined) {
//     //     throw new Error("pb is undefined");
//     //   }
//     // } catch (e) {
//       // User.findOne({ uid: userdata.uid }, (err, user) => {
//       //   user.personalBests = {
//       //     [result.mode]: {
//       //       [result.mode2]: [
//       //         {
//       //           language: result.language,
//       //           difficulty: result.difficulty,
//       //           punctuation: result.punctuation,
//       //           wpm: result.wpm,
//       //           acc: result.acc,
//       //           raw: result.rawWpm,
//       //           timestamp: Date.now(),
//       //           consistency: result.consistency,
//       //         },
//       //       ],
//       //     },
//       //   };
//       // }).then(() => {
//       //   return true;
//       // });
//     // }

//     let toUpdate = false;
//     let found = false;
//     try {
//       if (pbs[result.mode][result.mode2] === undefined) {
//         pbs[result.mode][result.mode2] = [];
//       }
//       pbs[result.mode][result.mode2].forEach((pb) => {
//         if (
//           pb.punctuation === result.punctuation &&
//           pb.difficulty === result.difficulty &&
//           pb.language === result.language
//         ) {
//           //entry like this already exists, compare wpm
//           found = true;
//           if (pb.wpm < result.wpm) {
//             //new pb
//             pb.wpm = result.wpm;
//             pb.acc = result.acc;
//             pb.raw = result.rawWpm;
//             pb.timestamp = Date.now();
//             pb.consistency = result.consistency;
//             toUpdate = true;
//           } else {
//             //no pb
//             return false;
//           }
//         }
//       });
//       //checked all pbs, nothing found - meaning this is a new pb
//       if (!found) {
//         pbs[result.mode][result.mode2] = [
//           {
//             language: result.language,
//             difficulty: result.difficulty,
//             punctuation: result.punctuation,
//             wpm: result.wpm,
//             acc: result.acc,
//             raw: result.rawWpm,
//             timestamp: Date.now(),
//             consistency: result.consistency,
//           },
//         ];
//         toUpdate = true;
//       }
//     } catch (e) {
//       // console.log(e);
//       pbs[result.mode] = {};
//       pbs[result.mode][result.mode2] = [
//         {
//           language: result.language,
//           difficulty: result.difficulty,
//           punctuation: result.punctuation,
//           wpm: result.wpm,
//           acc: result.acc,
//           raw: result.rawWpm,
//           timestamp: Date.now(),
//           consistency: result.consistency,
//         },
//       ];
//       toUpdate = true;
//     }

//     if (toUpdate) {
//       // User.findOne({ uid: userdata.uid }, (err, user) => {
//       //   user.personalBests = pbs;
//       //   user.save();
//       // });

//       //userdao update the whole personalBests parameter with pbs object
//       return true;
//     } else {
//       return false;
//     }
//   }
// }
