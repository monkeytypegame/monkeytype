const functions = require('firebase-functions');
const admin = require('firebase-admin');

var serviceAccount = require("./serviceAccountKey_live.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://monkey-type.firebaseio.com"
});


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });


exports.moveResults = functions.runWith({timeoutSeconds:540,memory: '2GB'}).https.onCall((request,response) => {

    return admin.firestore().collection('results').orderBy('timestamp','desc').limit(1000).get().then(data => {
        data.docs.forEach(doc => {
            let result = doc.data();
            if(result.moved === undefined || result.moved === false){
                admin.firestore().collection(`results`).doc(doc.id).update({moved:true});
                admin.firestore().collection(`users/${result.uid}/results`).add(result);
                console.log(`moving doc ${doc.id}`);
            }
        })
        return
    })

})