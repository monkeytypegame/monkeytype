const functions = require('firebase-functions');
const admin = require('firebase-admin');

let key = "./serviceAccountKey.json";

if(process.env.GCLOUD_PROJECT === "monkey-type"){
    key = "./serviceAccountKey_live.json"
}

var serviceAccount = require(key);

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
    // 1 - available
    // -1 - unavailable (taken)
    // -2 - not valid name
    // -999 - unknown error
    try{
        if(!isUsernameValid(request.name)) return -2;
        return getAllNames().then(data => {
            let available = 1;
            data.forEach(name =>{
                try{
                    if(name.toLowerCase() === request.name.toLowerCase()) available = -1;
                }catch(e){
                    //
                }
            })
            return available;
        });
    }catch(e){
        return -999;
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
                    console.error(`${request.uid} tried to change their name to ${request.name} - ${e.message}`);
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

function checkIfPB(uid,obj){
    return admin.firestore().collection(`users`).doc(uid).get().then(data => {
        let pbs = null;
        try{
            pbs = data.data().personalBests;
        }catch(e){
            return admin.firestore().collection('users').doc(uid).update({
                personalBests: {
                    [obj.mode]: {
                        [obj.mode2]: [{
                            language: obj.language,
                            difficulty: obj.difficulty,
                            punctuation: obj.punctuation,
                            wpm: obj.wpm
                        }]
                    }
                }
            }).then(e => {
                return true;
            }).catch(e => {
                return admin.firestore().collection('users').doc(uid).set({
                    personalBests: {
                        [obj.mode]: {
                            [obj.mode2]: [{
                                language: obj.language,
                                difficulty: obj.difficulty,
                                punctuation: obj.punctuation,
                                wpm: obj.wpm
                            }]
                        }
                    }
                }).then(e => {
                    return true;
                })
            })
                
            
        }
        // //check mode, mode2, punctuation, language and difficulty

        let toUpdate = false;
        let found = false;
        try{
            pbs[obj.mode][obj.mode2].forEach(pb => {
                if( pb.punctuation === obj.punctuation &&
                    pb.difficulty === obj.difficulty &&
                    pb.language === obj.language){
                        //entry like this already exists, compare wpm
                        found = true;
                        if(pb.wpm < obj.wpm){
                            //new pb
                            pb.wpm = obj.wpm;
                            toUpdate = true;
                        }else{
                            //no pb
                            return false;
                        }
                    }
            })
            //checked all pbs, nothing found - meaning this is a new pb
            if(!found){
                pbs[obj.mode][obj.mode2].push({
                    language: obj.language,
                    difficulty: obj.difficulty,
                    punctuation: obj.punctuation,
                    wpm: obj.wpm
                })
                toUpdate = true;
            }
        }catch(e){
            // console.log(e);
            pbs[obj.mode] = {};
            pbs[obj.mode][obj.mode2] = [{
                language: obj.language,
                difficulty: obj.difficulty,
                punctuation: obj.punctuation,
                wpm: obj.wpm
            }]; 
            toUpdate = true;
        }

        if(toUpdate){
            return admin.firestore().collection('users').doc(uid).update({personalBests: pbs}).then(e => {
                return true;
            });
        }else{
            return false;
        }
    })
}

exports.testCompleted = functions.https.onCall((request,response) => {
    try{
        if(request.uid === undefined || request.obj === undefined){
            console.error(`error saving result for ${request.uid} - missing input`);
            return -1;
        }

        let obj = request.obj;

        let err = false;
        Object.keys(obj).forEach(key => {
            let val = obj[key];
            if(Array.isArray(val)){
                val.forEach(valarr => {
                    if(!/^[0-9a-zA-Z._]+$/.test(valarr)) err = true;
                })
            }else{
                if(val === undefined || !/^[0-9a-zA-Z._]+$/.test(val)) err = true;
            }
        })
        if (err){
            console.error(`error saving result for ${request.uid} - bad input - ${JSON.stringify(request.obj)}`);
            return -1;
        }

        if (obj.wpm <= 0 || obj.wpm > 350 || obj.acc < 50 || obj.acc > 100){
            return -1;
        }

        return admin.firestore().collection(`users/${request.uid}/results`).add(obj).then(e => {

            return checkIfPB(request.uid,request.obj).then(e => {
                if(e){
                    return 2;
                }else{
                    return 1;
                }
            });
        }).catch(e => {
            console.error(`error saving result when checking for PB for ${request.uid} - ${e.message}`);
            return -1;
        });
    }catch(e){
        console.error(`error saving result for ${request.uid} - ${e}`);
        return -1;
    }
})

function isTagValid(name){
    if(name === null || name === undefined || name === "") return false;
    if(name.length > 16) return false;
    return /^[0-9a-zA-Z_.-]+$/.test(name);
}

exports.addTag = functions.https.onCall((request,response) => {
    try{

        if(!isTagValid(request.name)){
            return {resultCode:-1};
        }else{
            return admin.firestore().collection(`users/${request.uid}/tags`).add({
                name: request.name
            }).then(e => {
                console.log(`user ${request.uid} created a tag: ${request.name}`);
                return {
                    resultCode:1,
                    id: e.id
                };
            }).catch(e => {
                console.error(`error while creating tag for user ${request.uid}: ${e.message}`);
                return {resultCode:-999};
            })
        }

    }catch(e){
        console.error(`error adding tag for ${request.uid} - ${e}`);
        return {resultCode:-999};
    }
})

exports.editTag = functions.https.onCall((request,response) => {
    try{

        if(!isTagValid(request.name)){
            return {resultCode:-1};
        }else{
            return admin.firestore().collection(`users/${request.uid}/tags`).doc(request.tagid).update({
                name: request.name
            }).then(e => {
                console.log(`user ${request.uid} updated a tag: ${request.name}`);
                return {
                    resultCode:1
                };
            }).catch(e => {
                console.error(`error while updating tag for user ${request.uid}: ${e.message}`);
                return {resultCode:-999};
            })
        }

    }catch(e){
        console.error(`error updating tag for ${request.uid} - ${e}`);
        return {resultCode:-999};
    }
})

exports.removeTag = functions.https.onCall((request,response) => {
    try{

            return admin.firestore().collection(`users/${request.uid}/tags`).doc(request.tagid).delete().then(e => {
                console.log(`user ${request.uid} deleted a tag`);
                return {
                    resultCode:1
                };
            }).catch(e => {
                console.error(`error deleting tag for user ${request.uid}: ${e.message}`);
                return {resultCode:-999};
            })

    }catch(e){
        console.error(`error deleting tag for ${request.uid} - ${e}`);
        return {resultCode:-999};
    }
})

exports.updateResultTags = functions.https.onCall((request,response) => {
    try{
        let validTags = true;
        request.tags.forEach(tag => {
            if(!/^[0-9a-zA-Z]+$/.test(tag)) validTags = false;
        })
        if(validTags){
            return admin.firestore().collection(`users/${request.uid}/results`).doc(request.resultid).update({
                tags: request.tags
            }).then(e => {
                console.log(`user ${request.uid} updated tags for result ${request.resultid}`);
                return {
                    resultCode:1
                };
            }).catch(e => {
                console.error(`error while updating tags for result by user ${request.uid}: ${e.message}`);
                return {resultCode:-999};
            })
        }else{
            console.error(`invalid tags for user ${request.uid}: ${request.tags}`);
            return {resultCode:-1};
        }
    }catch(e){
        console.error(`error updating tags by ${request.uid} - ${e}`);
        return {resultCode:-999};
    }
})

function isConfigKeyValid(name){
    if(name === null || name === undefined || name === "") return false;
    if(name.length > 20) return false;
    return /^[0-9a-zA-Z_.-]+$/.test(name);
}

exports.saveConfig = functions.https.onCall((request,response) => {
    try{
        if(request.uid === undefined || request.obj === undefined){
            console.error(`error saving config for ${request.uid} - missing input`);
            return -1;
        }

        let obj = request.obj;

        let err = false;
        Object.keys(obj).forEach(key => {
            let val = obj[key];
            if(Array.isArray(val)){
                val.forEach(valarr => {
                    if(!isConfigKeyValid(valarr)) err = true;
                })
            }else{
                if(!isConfigKeyValid(val)) err = true;
            }
        })
        if (err){
            console.error(`error saving config for ${request.uid} - bad input`);
            return -1;
        }

        return admin.firestore().collection(`users`).doc(request.uid).set({
            config: obj
        }, {merge: true}).then(e => {
            return 1;
        }).catch(e => {
            console.error(`error saving config to DB for ${request.uid} - ${e.message}`);
            return -1;
        });
    }catch(e){
        console.error(`error saving config for ${request.uid} - ${e}`);
        return {resultCode:-999};
    }
})

// exports.getConfig = functions.https.onCall((request,response) => {
//     try{
//         if(request.uid === undefined){
//             console.error(`error getting config for ${request.uid} - missing input`);
//             return -1;
//         }

//         return admin.firestore().collection(`users`).doc(request.uid).get().then(e => {
//             return e.data().config;
//         }).catch(e => {
//             console.error(`error getting config from DB for ${request.uid} - ${e.message}`);
//             return -1;
//         });
//     }catch(e){
//         console.error(`error getting config for ${request.uid} - ${e}`);
//         return {resultCode:-999};
//     }
// })
