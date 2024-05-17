local redis_call = redis.call
local user_id, leaderboards_namespace = ARGV[1], ARGV[2]
local current_cursor, match_pattern = '0', leaderboards_namespace .. '*'
local operations = { results = 'HDEL', scores = 'ZREM' }

repeat
    local result = redis_call('SCAN', current_cursor, 'MATCH', match_pattern)
    local next_cursor, matched_keys = result[1], result[2]

    for _, key in ipairs(matched_keys) do
        local operation = operations[key:match("%w+$")]
        if operation then
            redis_call(operation, key, user_id)
        end
    end

    current_cursor = next_cursor
until current_cursor == '0'
