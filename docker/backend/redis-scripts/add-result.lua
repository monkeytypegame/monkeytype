local redis_call = redis.call
local leaderboard_scores_key, leaderboard_results_key = KEYS[1], KEYS[2]

local max_results = tonumber(ARGV[1])
local leaderboard_expiration_time = ARGV[2]
local user_id = ARGV[3]
local result_score = ARGV[4]
local result_data = ARGV[5]

local number_of_results_changed = redis_call('ZADD', leaderboard_scores_key, 'GT', 'CH', result_score, user_id)

if (number_of_results_changed == 1) then
    redis_call('HSET', leaderboard_results_key, user_id, result_data)
end

local number_of_results = redis_call('ZCARD', leaderboard_scores_key)

local removed_user_id = nil

if (number_of_results > max_results) then
    local user_with_lowest_score = redis_call('ZPOPMIN', leaderboard_scores_key)
    removed_user_id = user_with_lowest_score[1]

    if (removed_user_id ~= nil) then
        redis_call('HDEL', leaderboard_results_key, removed_user_id)
    end
end

if (number_of_results == 1) then -- Indicates that this is the first score of the day, set the leaderboard keys to expire at specified time
    redis_call('EXPIREAT', leaderboard_scores_key, leaderboard_expiration_time)
    redis_call('EXPIREAT', leaderboard_results_key, leaderboard_expiration_time)
end

if (number_of_results_changed == 1 and removed_user_id ~= user_id) then
    return redis_call('ZREVRANK', leaderboard_scores_key, user_id)
end

return nil
