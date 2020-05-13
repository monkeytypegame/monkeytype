const functions = require('firebase-functions');
const cors = require('cors');
const admin = require('firebase-admin');
admin.initializeApp();


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });


exports.sendEmailNotification = functions.https.onRequest(async (req, res) => {
    return cors(req, res, () => {

        admin.firestore().collection('mail').add({
            to: "bartnikjack@gmail.com",
            message: {
                subject: req.query.subject,
                html: req.query.body,
            }
        }).then(() => {
            console.log('Email queued');
            return res.send('Email queued');
        }).catch((e) => {
            console.log('Error adding email to queue ' + e);
            return res.send('Error adding email to queue ' + e);
        });
    });
});