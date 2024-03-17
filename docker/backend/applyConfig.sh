#!/bin/sh
if [ -f backend-configuration.json ]; then
  echo "waiting for backend..."

  timeout 30 sh -c 'until nc -z $0 $1; do sleep 1; done' localhost 5005

  if [ $? -ne 0 ]; then
    echo "failed to apply config"
    exit 1
  fi

  echo "apply server config"

  wget -qO- --method=PATCH \
    --body-data="`cat backend-configuration.json`" \
    --header='Content-Type:application/json' \
    http://localhost:5005/configuration

  echo "server config applied"
else
  echo "skip backend configuration"
fi
