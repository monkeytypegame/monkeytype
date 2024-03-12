#!/bin/sh
cd  /usr/share/nginx/html
echo "repace firebase config"
sed -i "s/###FIREBASE_APIKEY###/${FIREBASE_APIKEY}/g" js/firebase.*.js
sed -i "s/###FIREBASE_AUTHDOMAIN###/${FIREBASE_AUTHDOMAIN}/g" js/firebase.*.js
sed -i "s/###FIREBASE_PROJECTID###/${FIREBASE_PROJECTID}/g" js/firebase.*.js
sed -i "s/###FIREBASE_STORAGEBUCKET###/${FIREBASE_STORAGEBUCKET}/g" js/firebase.*.js
sed -i "s/###FIREBASE_MESSAGINGSENDERID###/${FIREBASE_MESSAGINGSENDERID}/g" js/firebase.*.js
sed -i "s/###FIREBASE_APPID###/${FIREBASE_APPID}/g" js/firebase.*.js


echo "use backend url ${MONKEYTYPE_BACKENDURL}"
sed -i "s/###MONKEYTYPE_BACKENDURL###/${MONKEYTYPE_BACKENDURL//\//\\/}/g" js/*.js

echo "use recapture ${RECAPTCHA_SITE_KEY}"
sed -i "s/###RECAPTCHA_SITE_KEY###/${RECAPTCHA_SITE_KEY//\//\\/}/g" js/*.js
