#!/bin/bash

source .env
echo "Deploying backend to $BE_HOST with script $BE_SCRIPT_PATH"

# Connect to SSH and execute remote script
ssh_output=$(ssh "$BE_USER@$BE_HOST" "$BE_SCRIPT_PATH")

# Print the output
echo "Remote script output:"
echo "$ssh_output"