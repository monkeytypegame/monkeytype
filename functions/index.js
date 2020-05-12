const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp();


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });


exports.sendEmailNotification = functions.https.onRequest(async (request, response) => {
    admin.firestore().collection('mail').add({
       to: "bartnikjack@gmail.com",
       message: {
         subject: request.query.subject,
         html: request.query.body,
       }
    }).then(() => {
        console.log('Email queued');
        return response.send('Email queued');
    }).catch((e) => {
        console.log('Error adding email to queue ' + e);
        return response.send('Error adding email to queue ' + e);

    });
});