#!/bin/bash

# Determine the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source the .env file from the parent directory of the script's directory
source "$SCRIPT_DIR/../.env"

echo "Running $BE_SCRIPT_PATH on $BE_HOST with user $BE_USER"

# Connect to SSH and execute remote script
ssh_output=$(ssh "$BE_USER@$BE_HOST" "$BE_SCRIPT_PATH")

# Capture the exit code of the SSH command
exit_code=$?

# Print the output
echo "$ssh_output"

# Forward the exit code of the remote script
exit $exit_code