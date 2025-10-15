// mAggregate.js
// Wrapper to simulate $function for MongoDB free tier

async function mAggregate(collection, pipeline) {
  // strip $function stages
  const strippedPipeline = pipeline.map(stage => {
    if (stage.$project) {
      const newStage = { $project: {} };
      for (const key in stage.$project) {
        if (stage.$project[key]?.$function) {
          // keep field but mark it for manual processing
          newStage.$project[key] = true;
        } else {
          newStage.$project[key] = stage.$project[key];
        }
      }
      return newStage;
    }
    return stage;
  });

  // run the modified aggregation
  const results = await collection.aggregate(strippedPipeline).toArray();

  // manually apply $function logic
  return results.map(doc => {
    for (const key in doc) {
      const origStage = pipeline.find(s => s.$project && s.$project[key]?.$function);
      if (origStage) {
        const fnCode = origStage.$project[key].$function.body; // JS code as string
        const argsNames = origStage.$project[key].$function.args || [];
        try {
          // build function dynamically
          const fn = new Function(...argsNames, fnCode);
          const argsValues = argsNames.map(arg => {
            if (typeof arg === "string" && arg.startsWith("$")) {
              const field = arg.slice(1);
              return doc[field];
            }
            return arg;
          });
          doc[key] = fn(...argsValues);
        } catch (e) {
          console.error("Error running $function simulation:", e);
        }
      }
    }
    return doc;
  });
}

module.exports = mAggregate;
