const db = firebase.firestore();

let dbSnapshot = null;

function db_testCompleted(obj) {

    if (obj.wpm == 0 || obj.wpm > 250 || obj.acc < 50 || obj.acc > 100) return false;

    let uid = "";
    let user = firebase.auth().currentUser;
    if (user) {
        uid = user.uid;
    }
    db.collection('results').add(obj)
}

async function db_getUserResults() {
    let user = firebase.auth().currentUser;
    if (user == null) return false;
    let ret = [];
    await db.collection('results')
        .orderBy('timestamp', 'desc')
        .where('uid', '==', user.uid)
        .get()
        .then(data => {
            console.log('getting data from db!');
            data.docs.forEach(doc => {
                ret.push(doc.data());
            })
        })
    dbSnapshot = ret;
    return ret;
}

async function db_getUserHighestWpm(mode, mode2) {

    function cont() {   
        let topWpm = 0;
        dbSnapshot.forEach(result => {
            if (result.mode == mode && result.mode2 == mode2) {
                if (result.wpm > topWpm) {
                    topWpm = result.wpm;
                }
            }
        })
        return topWpm;
    }

    let retval;
    if (dbSnapshot == null) {
        await db_getUserResults().then(data => {
            retval = cont();
        });
    } else {
        retval = cont();
    }
    return retval;

}
