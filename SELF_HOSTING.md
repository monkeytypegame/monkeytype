# Monkeytype Self Hosting

<!-- TOC ignore:true -->
## Table of contents
<!-- TOC -->

- [Monkeytype Self Hosting](#monkeytype-self-hosting)
    - [Prerequisitesss](#prerequisitesss)
    - [Quickstart](#quickstart)
    - [Authentication](#authentication)
    - [Leaderboards](#leaderboards)
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
- create an `.env` file, you can copy the content from the [example.env](https://github.com/monkeytypegame/monkeytype/tree/master/docker/example.env) and modify it. t.b.d
- create an `serviceAccountKey.json` file. you can copy the content from the [serviceAccountKey-example.json](https://github.com/monkeytypegame/monkeytype/tree/master/docker/serviceAccountKey-example.json) and modify it. t.b.d.
- download the [backend-configuration.json](https://github.com/monkeytypegame/monkeytype/tree/master/docker/backend-configuration.json)
- run `docker compose up -d`
- After the command exits successfully you can access [http://localhost:8080](http://localhost:8080)


## Authentication

- t.b.d
- how to setup firebase and update the recapture working

## Leaderboards

- t.b.d
- configuration to be done on /configure/ backend

## Configuration files

### .env file

All settings are described in the [example.env](https://github.com/monkeytypegame/monkeytype/tree/master/docker/example.env) file.

### serviceAccountKey.json

Contains your firebase config, only needed if you want to allow users to signup.

### backend-configuration.json

Configuration of the backend. 

_Note:_ The configuration is applied on container startup only. You have to restart the container for your changes to become active.