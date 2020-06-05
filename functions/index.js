const functions = require('firebase-functions');
const admin = require('firebase-admin');

var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://monkey-type-dev-67af4.firebaseio.com"
});


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });


exports.moveResults = functions.https.onCall((request,response) => {

    admin.firestore().collection('results').get().then(data => {
        data.docs.forEach(doc => {
            let result = doc.data();
            if(result.moved == undefined || result.moved == false){
                admin.firestore().collection(`results`).doc(doc.id).update({moved:true});
                admin.firestore().collection(`users/${result.uid}/results`).add(result);
                console.log(`moving doc ${doc.id}`);
            }else{
                console.log(`doc already moved`);
            }
        })
    })

})