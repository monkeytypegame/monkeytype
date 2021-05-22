- Transfer leaderboard and other cloud functions
- Reverse list of results on account page
- spinning wheel on account page should dissapear after data is loaded
- Account data should be updated when new result is added/test completed
- Add email verification
- Tests started and completed doesn't increment when quitting a running test
- Joined date doesn't look the same as it did before
- Personal bests items should not be arrays
  - should be objects that are set on new pb
- Move user data to localstorage instead of cookies
- Result is duplicated in analytics
  - Does entire result need to be stored in analytics
  - Should result be stored in seperate collection and then referenced in user doc and analytics?
- Loader should hide after tag is added, deleted, or edited
- Fix localhost, production, development server detection

  - Should be a setting in the .env

- Are personal bests calculated from actual result data?
  - Setting a low pb after resetting personal bests doesn't register on the scoreboard
- make sure refresh token won't expire
  - make refresh token expire after session if don't remeber me is set?
- Keep jwt and refresh in cookies?

- Get somebody else to check over security due to my lack of expertise

- Investigate and improve efficiency after mongo merge or during review
