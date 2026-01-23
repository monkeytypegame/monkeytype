## Build locally

From root directoy:

```
  docker buildx build --progress=plain --no-cache -t monkeytype/monkeytype-backend:latest . -f  ./docker/backend/Dockerfile
  docker buildx build --progress=plain --no-cache -t  monkeytype/monkeytype-frontend:latest . -f  ./docker/frontend/Dockerfile
```
