import firebase from "firebase";

fetch("/__/firebase/init.json")
  .then(async (response) => firebase.initializeApp(await response.json()))
  .then(() => {
    console.log("firebase initialized");
    import("./index");
  })
  .catch(console.error);
