const admin = require("firebase-admin");

module.exports = {
  async verifyIdToken(idToken) {
    return await admin.auth().verifyIdToken(idToken, true);
  },
  async updateAuthEmail(uid, email) {
    return await admin.auth().updateUser(uid, {
      email,
      emailVerified: false,
    });
  },
};
