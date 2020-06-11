const db = firebase.firestore();

let dbSnapshot = null;


async function db_getUserSnapshot() {
    let user = firebase.auth().currentUser;
    if (user == null) return false;
    let snap = {
        results: [],
        personalBests: {},
        tags: []
    };
    // await db.collection('results')
    //     .orderBy('timestamp', 'desc')
    //     .where('uid', '==', user.uid)
    //     .get()
    //     .then(data => {
    //         // console.log('getting data from db!');
    //         data.docs.forEach(doc => {
    //             ret.push(doc.data());
    //         })
    //     })
    await db.collection(`users/${user.uid}/results/`)
    .orderBy('timestamp', 'desc')
    .get()
    .then(data => {
        // console.log('getting data from db!');
        data.docs.forEach(doc => {
            let result = doc.data();
            result.id = doc.id;
            snap.results.push(result);
        })
    })
    await db.collection(`users/${user.uid}/tags/`)
    .get()
    .then(data => {
        // console.log('getting data from db!');
        data.docs.forEach(doc => {
            let tag = doc.data();
            tag.id = doc.id;
            snap.tags.push(tag);
        })
    })
    await db.collection('users').doc(user.uid)
    .get()
    .then(data => {
        // console.log('getting data from db!');
        try{
            snap.personalBests = data.data().personalBests;
        }catch(e){
            //
        }
    })
    dbSnapshot = snap;
    return dbSnapshot;
}

async function db_getUserHighestWpm(mode, mode2, punctuation, language, difficulty) {

    function cont() {   
        let topWpm = 0;
        dbSnapshot.results.forEach(result => {
            if (result.mode == mode && result.mode2 == mode2 && result.punctuation == punctuation && result.language == language && result.difficulty == difficulty) {
                if (result.wpm > topWpm) {
                    topWpm = result.wpm;
                }
            }
        })
        return topWpm;
    }

    let retval;
    if (dbSnapshot == null) {
        // await db_getUserResults().then(data => {
        //     retval = cont();
        // });
    } else {
        retval = cont();
    }
    return retval;

}

async function db_getLocalPB(mode, mode2, punctuation, language, difficulty){
    
    function cont() {   
        let ret = 0;
        try{
            dbSnapshot.personalBests[mode][mode2].forEach(pb => {
                if( pb.punctuation == punctuation &&
                    pb.difficulty == difficulty &&
                    pb.language == language){
                        ret = pb.wpm;
                    }
            })
            return ret;
        }catch(e){
            return ret;
        }
        
    }

    let retval;
    if (dbSnapshot == null) {
        // await db_getUserResults().then(data => {
        //     retval = cont();
        // });
    } else {
        retval = cont();
    }
    return retval;

}

async function db_saveLocalPB(mode, mode2, punctuation, language, difficulty, wpm){
    
    function cont() {   
        try{
            let found = false;
            dbSnapshot.personalBests[mode][mode2].forEach(pb => {
                if( pb.punctuation == punctuation &&
                    pb.difficulty == difficulty &&
                    pb.language == language){
                        found = true;
                        pb.wpm = wpm;
                    }
            })
            if(!found){
                //nothing found
                dbSnapshot.personalBests[mode][mode2].push({
                    language: language,
                    difficulty: difficulty,
                    punctuation: punctuation,
                    wpm: wpm
                })
            }
        }catch(e){
            //that mode or mode2 is not found
            dbSnapshot.personalBests[mode] = {};
            dbSnapshot.personalBests[mode][mode2] = [{
                language: language,
                difficulty: difficulty,
                punctuation: punctuation,
                wpm: wpm
            }]; 
        }
    }

    let retval;
    if (dbSnapshot == null) {
        // await db_getUserResults().then(data => {
        //     retval = cont();
        // });
    } else {
        cont();
    }
}