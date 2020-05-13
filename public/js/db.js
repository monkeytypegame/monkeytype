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

function db_addEmailToQueue(type, body) {

    let from = 'Annonymous';
    let subject = '';
    if (type == 'bug') {
        subject = 'New Bug Report';
    } else if (type == 'feature') {
        subject = 'New Feature Request';
    } else if (type == 'feedback') {
        subject = 'New Feedback';
    } else {
        showNotification('Error: Unsupported type',3000);
        return;
    }
  
    if (firebase.auth().currentUser != null) {
      from = firebase.auth().currentUser.email + ' (' + firebase.auth().currentUser.uid + ')';
    }
  
    // $.get("https://us-central1-monkey-type.cloudfunctions.net/sendEmailNotification",
    //   {
    //     subject: "New " + subject,
    //     body: body
    // })
    //   .done(data => {
    //     if (data == 'Email queued') {
    //       showNotification("Message sent. Thanks!", 3000);
    //     } else {
    //       showNotification("Unknown error", 3000);
    //     }
    //   }).fail(error => {
    //     showNotification("Unexpected error", 3000);
    //   });
  
    db.collection('mail').add({
        to: "bartnikjack@gmail.com",
        message: {
            subject: subject,
            html: body.replace(/\r\n|\r|\n/g,"<br>") + "<br><br>From: " + from,
        }
    }).then(() => {
        showNotification('Email sent',3000);
    }).catch((e) => {
        showNotification('Error while sending email: ' + e,5000);
    });
  
  }