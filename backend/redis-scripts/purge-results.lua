local redis_call = redis.call
local string_match = string.match

local user_id = ARGV[1]
local leaderboards_namespace = ARGV[2]

local current_cursor = '0'
local match_pattern = leaderboards_namespace .. '*'

repeat
    local result = redis_call('SCAN', current_cursor, 'MATCH', match_pattern)
    local next_cursor, matched_keys = result[1], result[2]

    for _, key in ipairs(matched_keys) do
        if (string_match(key, 'results')) then
            redis_call('HDEL', key, user_id)
        elseif (string_match(key, 'scores')) then
            redis_call('ZREM', key, user_id)
        end
    end

    current_cursor = next_cursor
until (current_cursor == '0')
