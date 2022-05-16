local leaderboard_scores_key, leaderboard_results_key = KEYS[1], KEYS[2]

local max_results = tonumber(ARGV[1])
local leaderboard_expiration_time = ARGV[2]
local user_id = ARGV[3]
local result_score = ARGV[4]
local result_data = ARGV[5]

local number_of_results_changed = redis.call('ZADD', leaderboard_scores_key, 'GT', 'CH', result_score, user_id)

if (number_of_results_changed == 1) then
    redis.call('HSET', leaderboard_results_key, user_id, result_data)
end

local number_of_results = redis.call('ZCARD', leaderboard_scores_key)

if (number_of_results > max_results) then
    local min_member = redis.call('ZPOPMIN', leaderboard_scores_key)
    local member_id = min_member[1]

    if (member_id ~= nil) then
        redis.call('HDEL', leaderboard_results_key, member_id)
    end
end

if (number_of_results == 1) then -- Indicates that this is the first score of the day, set the leaderboard keys to expire at specified time
    redis.call('EXPIREAT', leaderboard_scores_key, leaderboard_expiration_time)
    redis.call('EXPIREAT', leaderboard_results_key, leaderboard_expiration_time)
end
