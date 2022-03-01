// firebase init
import firebase from "firebase";
// @ts-ignore
import firebaserc from "../../.firebaserc";

const projectName = firebaserc.projects.default;
const apiKey = firebaserc.apiKey;
const firebaseConfig = {
  projectId: projectName,
  storageBucket: `${projectName}.appspot.com`,
  apiKey,
  authDomain: `${projectName}.firebaseapp.com`,
};

firebase.initializeApp(firebaseConfig);
