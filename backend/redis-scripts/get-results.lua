-- Helper to split CSV string into a list
local function split_csv(csv)
    local result = {}
    for user_id in string.gmatch(csv, '([^,]+)') do
        table.insert(result, user_id)
    end
    return result
end

local redis_call = redis.call
local leaderboard_scores_key, leaderboard_results_key = KEYS[1], KEYS[2]

local min_rank = tonumber(ARGV[1])
local max_rank = tonumber(ARGV[2])
local include_scores = ARGV[3]
local user_ids_csv = ARGV[4]

local results = {}
local scores = {}
local ranks = {}


-- Filtered leaderboard
if user_ids_csv ~= "" then  

    local filtered_user_ids = split_csv(user_ids_csv)
    local scored_users = {}
    for _, user_id in ipairs(filtered_user_ids) do
        local score = redis_call('ZSCORE', leaderboard_scores_key, user_id)
        if score then
            table.insert(scored_users, {user_id = user_id, score = tonumber(score)})
        end
    end
    table.sort(scored_users, function(a, b) return a.score > b.score end)



    for i = min_rank + 1, math.min(max_rank + 1, #scored_users) do
        local entry = scored_users[i]
        local user_id = entry.user_id
        local score = entry.score

        local result_data = redis_call('HGET', leaderboard_results_key, user_id)

        if result_data ~= nil then
            results[#results + 1] = result_data

            local global_rank = redis_call('ZREVRANK', leaderboard_scores_key, user_id)
            ranks[#ranks + 1] = global_rank or -1  -- -1 if not found
        end

        if include_scores == "true" then
            scores[#scores + 1] = score
        end
   
    end 
-- Global leaderboard
else

    local scores_in_range = redis_call('ZRANGE', leaderboard_scores_key, min_rank, max_rank, 'REV')

    for _, user_id in ipairs(scores_in_range) do
        local result_data = redis_call('HGET', leaderboard_results_key, user_id)

        if (include_scores == "true") then
            scores[#scores + 1] = redis_call('ZSCORE', leaderboard_scores_key, user_id)
        end

        if (result_data ~= nil) then
            results[#results + 1] = result_data
        end
    end
end

return {results, scores, ranks}