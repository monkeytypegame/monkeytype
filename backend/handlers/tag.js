
async function checkIfTagPB(obj, userdata) {
  //function returns a list of tag ids where a pb was set //i think
  if (obj.tags.length === 0) {
    return [];
  }
  if (obj.mode === "quote") {
    return [];
  }
  let dbtags = []; //tags from database: include entire document: name, id, pbs
  let restags = obj.tags; //result tags
  try {
    let snap;
    await User.findOne({ uid: userdata.uid }, (err, user) => {
      snap = user.tags;
    });
    snap.forEach((doc) => {
      //if (restags.includes(doc._id)) {
      //if (restags.indexOf((doc._id).toString()) > -1) {
      if (restags.includes(doc._id.toString())) {
        //not sure what this is supposed to do
        /*
                let data = doc.data();
                data.id = doc.id;
                dbtags.push(data);
                */
        dbtags.push(doc);
      }
    });
  } catch {
    return [];
  }
  let ret = [];
  for (let i = 0; i < dbtags.length; i++) {
    let pbs = null;
    try {
      pbs = dbtags[i].personalBests;
      if (pbs === undefined || pbs === {}) {
        throw new Error("pb is undefined");
      }
    } catch (e) {
      //if pb is undefined, create a new personalBests field with only specified value
      await User.findOne({ uid: userdata.uid }, (err, user) => {
        //it might be more convenient if tags was an object with ids as the keys
        //find tag index in tags list
        // save that tags personal bests as object
        let j = user.tags.findIndex((tag) => {
          return tag._id.toString() == dbtags[i]._id.toString();
        });
        user.tags[j].personalBests = {
          [obj.mode]: {
            [obj.mode2]: [
              {
                language: obj.language,
                difficulty: obj.difficulty,
                punctuation: obj.punctuation,
                wpm: obj.wpm,
                acc: obj.acc,
                raw: obj.rawWpm,
                timestamp: Date.now(),
                consistency: obj.consistency,
              },
            ],
          },
        };
        pbs = user.tags[j].personalBests;
        user.save();
      }).then((updatedUser) => {
        ret.push(dbtags[i]._id.toString());
      });
      continue;
    }
    let toUpdate = false;
    let found = false;
    try {
      if (pbs[obj.mode] === undefined) {
        pbs[obj.mode] = { [obj.mode2]: [] };
      } else if (pbs[obj.mode][obj.mode2] === undefined) {
        pbs[obj.mode][obj.mode2] = [];
      }
      pbs[obj.mode][obj.mode2].forEach((pb) => {
        if (
          pb.punctuation === obj.punctuation &&
          pb.difficulty === obj.difficulty &&
          pb.language === obj.language
        ) {
          //entry like this already exists, compare wpm
          found = true;
          if (pb.wpm < obj.wpm) {
            //replace old pb with new obj
            pb.wpm = obj.wpm;
            pb.acc = obj.acc;
            pb.raw = obj.rawWpm;
            pb.timestamp = Date.now();
            pb.consistency = obj.consistency;
            toUpdate = true;
          } else {
            //no pb
            return false;
          }
        }
      });
      //checked all pbs, nothing found - meaning this is a new pb
      if (!found) {
        console.log("Semi-new pb");
        //push this pb to array
        pbs[obj.mode][obj.mode2].push({
          language: obj.language,
          difficulty: obj.difficulty,
          punctuation: obj.punctuation,
          wpm: obj.wpm,
          acc: obj.acc,
          raw: obj.rawWpm,
          timestamp: Date.now(),
          consistency: obj.consistency,
        });
        toUpdate = true;
      }
    } catch (e) {
      // console.log(e);
      console.log("Catch pb");
      console.log(e);
      pbs[obj.mode] = {};
      pbs[obj.mode][obj.mode2] = [
        {
          language: obj.language,
          difficulty: obj.difficulty,
          punctuation: obj.punctuation,
          wpm: obj.wpm,
          acc: obj.acc,
          raw: obj.rawWpm,
          timestamp: Date.now(),
          consistency: obj.consistency,
        },
      ];
      toUpdate = true;
    }

    if (toUpdate) {
      //push working pb array to user tags pbs
      await User.findOne({ uid: userdata.uid }, (err, user) => {
        for (let j = 0; j < user.tags.length; j++) {
          if (user.tags[j]._id.toString() === dbtags[i]._id.toString()) {
            user.tags[j].personalBests = pbs;
          }
        }
        user.save();
      });
      ret.push(dbtags[i]._id.toString());
    }
  }
  console.log(ret);
  return ret;
}



app.post("/clearTagPb", authenticateToken, (req, res) => {
  User.findOne({ uid: req.uid }, (err, user) => {
    for (let i = 0; i < user.tags.length; i++) {
      if (user.tags[i]._id.toString() === req.body.tagid.toString()) {
        user.tags[i].personalBests = {};
        user.save();
        res.send({ resultCode: 1 });
        return;
      }
    }
  }).catch((e) => {
    console.error(`error deleting tag pb for user ${req.uid}: ${e.message}`);
    res.send({
      resultCode: -999,
      message: e.message,
    });
  });
  res.sendStatus(200);
});


//could use /tags/add instead
app.post("/addTag", authenticateToken, (req, res) => {
  try {
    if (!isTagPresetNameValid(req.body.tagName)) return { resultCode: -1 };
    User.findOne({ uid: req.uid }, (err, user) => {
      if (err) res.status(500).send({ error: err });
      if (user.tags.includes(req.body.tagName)) {
        return { resultCode: -999, message: "Duplicate tag" };
      }
      const tagObj = { name: req.body.tagName };
      user.tags.push(tagObj);
      user.save();
    })
      .then(() => {
        console.log(`user ${req.uid} created a tag: ${req.body.tagName}`);
        let newTagId;
        User.findOne({ uid: req.uid }, (err, user) => {
          newTagId = user.tags[user.tags.length - 1]._id;
        }).then(() => {
          res.json({
            resultCode: 1,
            id: newTagId,
          });
        });
      })
      .catch((e) => {
        console.error(
          `error while creating tag for user ${req.uid}: ${e.message}`
        );
        res.json({ resultCode: -999, message: e.message });
      });
  } catch (e) {
    console.error(`error adding tag for ${req.uid} - ${e}`);
    res.json({ resultCode: -999, message: e.message });
  }
});

app.post("/editTag", authenticateToken, (req, res) => {
  try {
    if (!isTagPresetNameValid(req.body.tagName)) return { resultCode: -1 };
    User.findOne({ uid: req.uid }, (err, user) => {
      if (err) res.status(500).send({ error: err });
      for (var i = 0; i < user.tags.length; i++) {
        if (user.tags[i]._id == req.body.tagId) {
          user.tags[i].name = req.body.tagName;
        }
      }
      user.save();
    })
      .then((updatedUser) => {
        console.log(`user ${req.uid} updated a tag: ${req.body.tagName}`);
        res.json({ resultCode: 1 });
      })
      .catch((e) => {
        console.error(
          `error while updating tag for user ${req.uid}: ${e.message}`
        );
        res.json({ resultCode: -999, message: e.message });
      });
  } catch (e) {
    console.error(`error updating tag for ${req.uid} - ${e}`);
    res.json({ resultCode: -999, message: e.message });
  }
});

app.post("/removeTag", authenticateToken, (req, res) => {
  try {
    User.findOne({ uid: req.uid }, (err, user) => {
      if (err) res.status(500).send({ error: err });
      for (var i = 0; i < user.tags.length; i++) {
        if (user.tags[i]._id == req.body.tagId) {
          user.tags.splice(i, 1);
        }
      }
      user.save();
    })
      .then((updatedUser) => {
        console.log(`user ${req.uid} deleted a tag`);
        res.json({ resultCode: 1 });
      })
      .catch((e) => {
        console.error(`error deleting tag for user ${req.uid}: ${e.message}`);
        res.json({ resultCode: -999 });
      });
  } catch (e) {
    console.error(`error deleting tag for ${req.uid} - ${e}`);
    res.json({ resultCode: -999 });
  }
});
