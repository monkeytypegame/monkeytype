const functions = require('firebase-functions');
const admin = require('firebase-admin');

var serviceAccount = require("./serviceAccountKey_live.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });


exports.moveResults = functions.runWith({timeoutSeconds:540,memory: '2GB'}).https.onCall((request,response) => {

    return admin.firestore().collection('results').orderBy('timestamp','desc').limit(2000).get().then(data => {
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

function getAllNames(){
    return admin.auth().listUsers().then(data=>{
        let names = [];
        data.users.forEach(user =>{
            names.push(user.displayName);
        })
        return names;
    })
}

function getAllUsers(){
    return admin.auth().listUsers().then(data=>{
        return data.users;
    })
}

function isUsernameValid(name){
    if(name === null || name === undefined || name === "") return false;
    if(/miodec/.test(name)) return false;
    if(name.length > 12) return false;
    return /^[0-9a-zA-Z_.-]+$/.test(name);
}

exports.checkNameAvailability = functions.https.onCall((request,response) => {
    try{
        if(!isUsernameValid(request.name)) return 0;
        return getAllNames().then(data => {
            let available = 1;
            data.forEach(name =>{
                try{
                    if(name.toLowerCase() === request.name.toLowerCase()) available = 0;
                }catch(e){
                    //
                }
            })
            return available;
        });
    }catch(e){
        return -1;
    }
})

exports.changeName = functions.https.onCall((request,response) => {
    try{
        if(!isUsernameValid(request.name)){
            console.warn(`${request.uid} tried to change their name to ${request.name} - not valid`);
            return 0;
        }
        return getAllNames().then(data => {
            let available = 1;
            data.forEach(name =>{
                try{
                    if(name.toLowerCase() === request.name.toLowerCase()) available = 0;
                }catch(e){
                    //
                }
            })
            if(available === 1){
                return admin.auth().updateUser(request.uid,{
                    displayName: request.name
                }).then(d => {
                    console.log(`${request.uid} changed their name to ${request.name} - done`);
                    return 1;
                }).catch(e => {
                    console.error(`${request.uid} tried to change their name to ${request.name} - ${e}`);
                    return -1;
                })
            }else{
                console.warn(`${request.uid} tried to change their name to ${request.name} - already taken`);
                return 0;
            }
        });
    }catch(e){
        console.error(`${request.uid} tried to change their name to ${request.name} - ${e}`);
        return -1;
    }
})


exports.checkIfNeedsToChangeName = functions.https.onCall((request,response) => {
    try{
        return admin.auth().getUser(request.uid).then(requestUser => {

            if(!isUsernameValid(requestUser.displayName)){
                //invalid name, needs to change
                console.log(`user ${requestUser.uid} ${requestUser.displayName} needs to change name`);
                return 1;
            }else{
                //valid name, but need to change if not duplicate

                return getAllUsers().then(users => {

                    let sameName = [];

                    //look for name names
                    users.forEach(user => {
                        if (user.uid !== requestUser.uid){
                            try{
                                if(user.displayName.toLowerCase() === requestUser.displayName.toLowerCase()){
                                    sameName.push(user);
                                }
                            }catch(e){
                                //
                            }
                        }
                    })

                    if(sameName.length === 0){
                        return 0
                    }else{
                        //check when the request user made the account compared to others
                        let earliestTimestamp = 999999999999999;
                        sameName.forEach(sn => {
                            let ts = (new Date(sn.metadata.creationTime).getTime() / 1000);
                            if(ts <= earliestTimestamp){
                                earliestTimestamp = ts;
                            }
                        })

                        if((new Date(requestUser.metadata.creationTime).getTime() / 1000) > earliestTimestamp){
                            console.log(`user ${requestUser.uid} ${requestUser.displayName} needs to change name`);
                            return 2;
                        }else{
                            return 0;
                        }

                    }



                })

            }
        });
    }catch(e){
        return -1;
    }

})

exports.testCompleted = functions.https.onCall((request,response) => {
    if(request.uid === undefined || request.obj === undefined) return -1;
    try{

        let obj = request.obj;

        let err = false;
        Object.keys(obj).forEach(key => {
            let val = obj[key];
            if(val === undefined || !/^[0-9a-zA-Z._]+$/.test(val)) err = true;
        })
        if (err){
            console.error(`error saving result for ${request.uid} - bad input`);
            return -1;
        }

        if (obj.wpm <= 0 || obj.wpm > 350 || obj.acc < 50 || obj.acc > 100){
            return -1;
        }

        return admin.firestore().collection(`users/${request.uid}/results`).add(obj).then(e => {
            return 1;
        }).catch(e => {
            console.error(`error saving result for ${request.uid} - ${e}`);
            return -1;
        });
    }catch(e){
        console.error(`error saving result for ${request.uid} - ${e}`);
        return -1;
    }
})