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

local user_id = ARGV[1]
local include_scores = ARGV[2]
local user_ids_csv = ARGV[3]

local rank = nil
local friendsRank = nil
local result = {}   
local score = ''


-- filtered leaderboard
if user_ids_csv ~= "" then

    local filtered_user_ids = split_csv(user_ids_csv)
    local scored_users = {}
    for _, user_id in ipairs(filtered_user_ids) do
        local score = redis_call('ZSCORE', leaderboard_scores_key, user_id)
        if score then
            local number_score = tonumber(score)            
            table.insert(scored_users, {user_id = user_id, score = number_score})
        end
    end
    table.sort(scored_users, function(a, b) return a.score > b.score end)   

    for i = 1, #scored_users do
        if scored_users[i].user_id == user_id then
            friendsRank = i - 1
        end
    end

end

rank = redis_call('ZREVRANK', leaderboard_scores_key, user_id)
if (include_scores == "true") then
    score = redis_call('ZSCORE', leaderboard_scores_key, user_id)
end
result = redis_call('HGET', leaderboard_results_key, user_id)

return {rank, score, result, friendsRank}