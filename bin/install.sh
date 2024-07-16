npm ci &
cd ./frontend && npm ci &
cd ./backend && npm ci &
cd ./shared && npm ci &
wait
