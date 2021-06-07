
app.post("/addPreset", authenticateToken, (req, res) => {
  try {
    if (!isTagPresetNameValid(req.body.obj.name)) {
      return { resultCode: -1 };
    } else if (req.uid === undefined || req.body.obj === undefined) {
      console.error(`error saving config for ${req.uid} - missing input`);
      res.json({
        resultCode: -1,
        message: "Missing input",
      });
    } else {
      let config = req.body.obj.config;
      let errorMessage = "";
      let err = false;
      Object.keys(config).forEach((key) => {
        if (err) return;
        if (!isConfigKeyValid(key)) {
          err = true;
          console.error(`${key} failed regex check`);
          errorMessage = `${key} failed regex check`;
        }
        if (err) return;
        if (key === "resultFilters") return;
        if (key === "customBackground") return;
        let val = config[key];
        if (Array.isArray(val)) {
          val.forEach((valarr) => {
            if (!isConfigKeyValid(valarr)) {
              err = true;
              console.error(`${key}: ${valarr} failed regex check`);
              errorMessage = `${key}: ${valarr} failed regex check`;
            }
          });
        } else {
          if (!isConfigKeyValid(val)) {
            err = true;
            console.error(`${key}: ${val} failed regex check`);
            errorMessage = `${key}: ${val} failed regex check`;
          }
        }
      });
      if (err) {
        console.error(
          `error adding preset for ${req.uid} - bad input - ${JSON.stringify(
            req.body.obj
          )}`
        );
        res.json({
          resultCode: -1,
          message: "Bad input. " + errorMessage,
        });
      }

      User.findOne({ uid: req.uid }, (err, user) => {
        if (user.presets.length >= 10) {
          res.json({
            resultCode: -2,
            message: "Preset limit",
          });
        } else {
          user.presets.push(req.body.obj);
          user.save();
        }
      })
        .then((updatedUser) => {
          User.findOne({ uid: req.uid }, (err, user) => {
            res.json({
              resultCode: 1,
              message: "Saved",
              id: user.presets[user.presets.length - 1]._id,
            });
          });
        })
        .catch((e) => {
          console.error(
            `error adding preset to DB for ${req.uid} - ${e.message}`
          );
          res.json({
            resultCode: -1,
            message: e.message,
          });
        });
    }
  } catch (e) {
    console.error(`error adding preset for ${req.uid} - ${e}`);
    res.json({
      resultCode: -999,
      message: e,
    });
  }
});

app.post("/editPreset", authenticateToken, (req, res) => {
  try {
    if (!isTagPresetNameValid(req.body.presetName)) {
      res.json({ resultCode: -1 });
    } else {
      User.findOne({ uid: req.uid }, (err, user) => {
        for (i = 0; i < user.presets.length; i++) {
          if (user.presets[i]._id.toString() == req.body.presetid.toString()) {
            user.presets[i] = {
              config: req.body.config,
              name: req.body.presetName,
            };
            break;
          }
        }
        user.save();
      })
        .then((e) => {
          console.log(
            `user ${req.uid} updated a preset: ${req.body.presetName}`
          );
          res.json({
            resultCode: 1,
          });
        })
        .catch((e) => {
          console.error(
            `error while updating preset for user ${req.uid}: ${e.message}`
          );
          res.json({ resultCode: -999, message: e.message });
        });
    }
  } catch (e) {
    console.error(`error updating preset for ${req.uid} - ${e}`);
    res.json({ resultCode: -999, message: e.message });
  }
});

app.post("/removePreset", authenticateToken, (req, res) => {
  try {
    User.findOne({ uid: req.uid }, (err, user) => {
      for (i = 0; i < user.presets.length; i++) {
        if (user.presets[i]._id.toString() == req.body.presetid.toString()) {
          user.presets.splice(i, 1);
          break;
        }
      }
      user.save();
    })
      .then((e) => {
        console.log(`user ${req.uid} deleted a preset`);
        res.send({ resultCode: 1 });
      })
      .catch((e) => {
        console.error(
          `error deleting preset for user ${req.uid}: ${e.message}`
        );
        res.send({ resultCode: -999 });
      });
  } catch (e) {
    console.error(`error deleting preset for ${req.uid} - ${e}`);
    res.send({ resultCode: -999 });
  }
});
