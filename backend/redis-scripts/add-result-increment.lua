local redis_call = redis.call
local leaderboard_scores_key, leaderboard_results_key = KEYS[1], KEYS[2]

local leaderboard_expiration_time = ARGV[1]
local user_id = ARGV[2]
local xp_gained = tonumber(ARGV[3])
local user_data = ARGV[4]

redis_call('ZINCRBY', leaderboard_scores_key, xp_gained, user_id)
redis_call('HSET', leaderboard_results_key, user_id, user_data)

local number_of_results = redis_call('ZCARD', leaderboard_scores_key)

if (number_of_results == 1) then
    redis_call('EXPIREAT', leaderboard_scores_key, leaderboard_expiration_time)
    redis_call('EXPIREAT', leaderboard_results_key, leaderboard_expiration_time)
end

return redis_call('ZREVRANK', leaderboard_scores_key, user_id)
