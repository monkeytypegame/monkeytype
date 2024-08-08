#!/bin/bash
source .env
echo "Purging Cloudflare cache for zone $CF_ZONE_ID"
response=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
     -H "Authorization: Bearer $CF_API_KEY" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything":true}')

success=$(echo "$response" | grep -o '"success": true')

if [ "$success" ]; then
    echo "Cache purged successfully."
else
    echo "Cache purge failed."
    echo "Response:"
    echo "$response"
fi