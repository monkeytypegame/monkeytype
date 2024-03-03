# Monkeytype Self Hosting

<!-- TOC ignore:true -->

## Table of contents

<!-- TOC -->

- [Monkeytype Self Hosting](#monkeytype-self-hosting)
    - [Table of contents](#table-of-contents)
    - [Prerequisites](#prerequisites)
    - [Quickstart](#quickstart)
    - [Account System](#account-system)
        - [Setup Firebase](#setup-firebase)
        - [Update backend configuration](#update-backend-configuration)
        - [Setup Recaptcha](#setup-recaptcha)
    - [Enable daily leaderboards](#enable-daily-leaderboards)
    - [Configuration files](#configuration-files)
        - [env file](#env-file)
        - [serviceAccountKey.json](#serviceaccountkeyjson)
        - [backend-configuration.json](#backend-configurationjson)

<!-- /TOC -->


## Prerequisites
- you need `docker` and `docker-compose-plugin` installed. Follow the [docker documentation](https://docs.docker.com/compose/install/) on how to do this.

## Quickstart

- create a new directory, e.g.  `monkeytype` and open it.
- download the [docker-compose.yml](https://github.com/monkeytypegame/monkeytype/tree/master/docker/docker-compose.yml)
- create an `.env` file, you can copy the content from the [example.env](https://github.com/monkeytypegame/monkeytype/tree/master/docker/example.env).
- create an `serviceAccountKey.json` file. you can copy the content from the [serviceAccountKey-example.json](https://github.com/monkeytypegame/monkeytype/tree/master/docker/serviceAccountKey-example.json).
- download the [backend-configuration.json](https://github.com/monkeytypegame/monkeytype/tree/master/docker/backend-configuration.json)
- run `docker compose up -d`
- After the command exits successfully you can access [http://localhost:8080](http://localhost:8080)


## Account System

User signup/login is disabled by default. To allow users to signup you'll need to setup a Firebase project. 

### Setup Firebase

- create a [Firebase](https://firebase.google.com/) account
- create a [new Firebase project](https://console.firebase.google.com/u/0/).
  - name "monkeytype"
  - uncheck "enable google analytics"
- enable authentication
  - open the [firebase console](https://console.firebase.google.com/) and open your project
  - go to `Authentication > Sign-in method`  
  - enable `Email/Password` and save
- generate service account
  - open the project settings by clicking the `⚙` icon on the sidebar and `Project settings`
  - go to `Service accounts`
  - click `Generate new private key`. This will download a `.json` file.
  - store the `.json` file as `serviceAccountKey.json`

- update the `.env` file
  - open the [firebase console](https://console.firebase.google.com/) and open your project
  - open the project settings by clicking the `⚙` icon on the sidebar and `Project settings`
  - If there is no app in your project create a new web-app `</>`
    - nickname `monkeytype`
    - uncheck `set up firebase hosting`
    - click `Register app` 
   - select your app and select `Config` for `SDK setup and configuration`
   - it will display sth like this:
        ```
        const firebaseConfig = {
        apiKey: "AAAAAAAA",
        authDomain: "monkeytype-00000.firebaseapp.com",
        projectId: "monkeytype-00000",
        storageBucket: "monkeytype-00000.appspot.com",
        messagingSenderId: "90000000000",
        appId: "1:90000000000:web:000000000000"
        };
        ```
   - update the `.env` file with the values above:
        ```
        FIREBASE_APIKEY="AAAAAAAA"
        FIREBASE_AUTHDOMAIN="monkeytype-00000.firebaseapp.com"
        FIREBASE_PROJECTID="monkeytype-00000"
        FIREBASE_STORAGEBUCKET="monkeytype-00000.appspot.com"
        FIREBASE_MESSAGINGSENDERID="90000000000"
        FIREBASE_APPID="1:90000000000:web:000000000000"   
        ```

### Update backend configuration

- update the `backend-configuration.json` file and add/modify
    ```json
    {
        "users": {
            "signUp": true,
            "profiles": {
                "enabled": true
            }
        }
    }
    ```

### Setup Recaptcha

t.b.d.


## Enable daily leaderboards

To enable daily leaderboards update the `backend-configuration.json` file and add/modify
```json
{
    "dailyLeaderboards": {
        "enabled": true,
        "maxResults": 250,
        "leaderboardExpirationTimeInDays": 1,
        "validModeRules": [
            {
                "language": "english",
                "mode": "time",
                "mode2": "15"
            },
            {
                "language": "english",
                "mode": "time",
                "mode2": "60"
            }
        ]
    }
}
```

- language is one of the supported language
- mode can be `time` or `words`
- mode2 can be `15`,`30`,`60` or `120` if you picked `mode=time` or `10`,`25`,`50` or `100` if you picked `mode=words`.

## Configuration files

### env file

All settings are described in the [example.env](https://github.com/monkeytypegame/monkeytype/tree/master/docker/example.env) file.

### serviceAccountKey.json

Contains your firebase config, only needed if you want to allow users to signup.

### backend-configuration.json

Configuration of the backend. 

_Note:_ The configuration is applied on container startup only. You have to restart the container for your changes to become active.