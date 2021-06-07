async function incrementPublicTypingStats(started, completed, time) {
  try {
    time = roundTo2(time);
    Stats.findOne({}, (err, stats) => {
      stats.completedTests += completed;
      stats.startedTests += started;
      stats.timeTyping += time;
      stats.save();
    });
  } catch (e) {
    console.error(`Error while incrementing public stats: ${e}`);
  }
}


// Initialize stats database if none exists
Stats.findOne((err, stats) => {
  if (!stats) {
    let newStats = new Stats({
      completedTests: 0,
      startedTests: 0,
      timeTyping: 0,
    });
    newStats.save();
  }
});
