// To find your config, go to https://console.firebase.google.com/ and select your project
// Go to (top left) Settings > Project Settings > General
// scroll down to Your apps > Web Apps (if it doesnt exist, create one) > SDK setup and configuration > select npm
// your config should be visible there

import type { FirebaseOptions } from "firebase/app";

export const firebaseConfig: FirebaseOptions = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};
