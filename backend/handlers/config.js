

app.post("/saveConfig", authenticateToken, (req, res) => {
  try {
    if (req.uid === undefined || req.body.obj === undefined) {
      console.error(`error saving config for ${req.uid} - missing input`);
      res.send({
        resultCode: -1,
        message: "Missing input",
      });
    }

    let obj = req.body.obj;
    let errorMessage = "";
    let err = false;
    Object.keys(obj).forEach((key) => {
      if (err) return;
      if (!isConfigKeyValid(key)) {
        err = true;
        console.error(`${key} failed regex check`);
        errorMessage = `${key} failed regex check`;
      }
      if (err) return;
      if (key === "resultFilters") return;
      if (key === "customBackground") return;
      let val = obj[key];
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
        `error saving config for ${req.uid} - bad input - ${JSON.stringify(
          request.obj
        )}`
      );
      res.send({
        resultCode: -1,
        message: "Bad input. " + errorMessage,
      });
    }

    User.findOne({ uid: req.uid }, (err, user) => {
      if (err) res.status(500).send({ error: err });
      user.config = obj;
      user.save();
    })
      .then(() => {
        res.send({
          resultCode: 1,
          message: "Saved",
        });
      })
      .catch((e) => {
        console.error(
          `error saving config to DB for ${req.uid} - ${e.message}`
        );
        res.send({
          resultCode: -1,
          message: e.message,
        });
      });
  } catch (e) {
    console.error(`error saving config for ${req.uid} - ${e}`);
    res.send({
      resultCode: -999,
      message: e,
    });
  }
});
