local redis_call = redis.call
local leaderboard_scores_key, leaderboard_results_key = KEYS[1], KEYS[2]
local min_rank = tonumber(ARGV[1])
local max_rank = tonumber(ARGV[2])
local include_scores = ARGV[3] == "true"

local results = {}
local scores = {}
local user_ids = redis_call('ZRANGE', leaderboard_scores_key, min_rank, max_rank, 'REV')

for _, user_id in ipairs(user_ids) do
    local result_data = redis_call('HGET', leaderboard_results_key, user_id)
    if result_data ~= nil then
        results[#results + 1] = result_data
    end
    if include_scores then
        scores[#scores + 1] = redis_call('ZSCORE', leaderboard_scores_key, user_id)
    end
end

return {results, scores}
