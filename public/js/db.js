const db = firebase.firestore();

function db_testCompleted(wpm, correctChars, incorrectChars, acc, mode, mode2) {

    if (wpm > 250 || acc < 50 || acc > 100) return false;

    let uid = "";
    let user = firebase.auth().currentUser;
    if (user) {
        uid = user.uid;
    }
    db.collection('results').add({
        uid: uid,
        wpm: wpm,
        correctChars: correctChars,
        incorrectChars: incorrectChars,
        acc: acc,
        mode: mode,
        mode2: mode2,
        timestamp: Date.now()
    })
}

async function db_getUserResults() {
    let user = firebase.auth().currentUser;
    if (user == null) return false;
    let ret = [];
    await db.collection('results').orderBy('timestamp').where('uid', '==', user.uid).get().then(data => {

        data.docs.forEach(doc => {
            ret.push(doc.data());
        })
    })
    return ret;

}

async function db_getUserHighestWpm(mode, mode2) {
    let user = firebase.auth().currentUser;
    if (user == null) return false;
    let ret = {};
    await db.collection('results')
        .where('uid', '==', user.uid)
        .where('mode', '==', mode)
        .where('mode2', '==', mode2)
        .orderBy('wpm', "desc")
        .limit(1)
        .get().then(data => {
            ret = data.docs[0].data()
        }).catch(e => {
            ret = false;
        })
    return ret;

}