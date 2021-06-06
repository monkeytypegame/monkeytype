const admin = require("firebase-admin");

module.exports = {
  async verifyIdToken(idToken) {
    return await admin.auth().verifyIdToken(idToken);
  },
};
