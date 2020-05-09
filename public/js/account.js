$(".pageAccount .register input").keyup(e => {
    if (e.key == "Enter") {

        let name = $(".pageAccount .register input")[0].value;
        let email = $(".pageAccount .register input")[1].value;
        let password = $(".pageAccount .register input")[2].value;

        firebase.auth().createUserWithEmailAndPassword(email, password).then(user => {
            // Account has been created here.
            let usr = user.user;
            usr.updateProfile({
                displayName: name
              }).then(function() {
                // Update successful.
                alert('user created');
              }).catch(function(error) {
                // An error happened.
                usr.delete().then(function() {
                // User deleted.
                alert('cant have this display name');
                }).catch(function(error) {
                // An error happened.
                    
                });
            });
          }).catch(function(error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            alert(errorMessage);
          });

        
    }
})

firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in.
      var displayName = user.displayName;
      var email = user.email;
      var emailVerified = user.emailVerified;
      var photoURL = user.photoURL;
      var isAnonymous = user.isAnonymous;
      var uid = user.uid;
        var providerData = user.providerData;
        console.log('user signed in');
      // ...
    } else {
      // User is signed out.
      // ...
    }
  });


