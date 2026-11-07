#!/usr/bin/env sh
# Libera el puerto de un dev server (vite 3010, wrangler 3011) si quedó vivo de una sesión
# anterior (p. ej. una terminal cerrada sin Ctrl+C). Cierra el proceso que escucha y, si es
# workerd, también su wrangler padre (si no, wrangler lo relanza).
PORT="${1:?Uso: free-port.sh <puerto>}"
MAX_WAIT_SECONDS=5

PIDS=$(lsof -t -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null)
[ -z "$PIDS" ] && exit 0

for PID in $PIDS; do
  PARENT=$(ps -o ppid= -p "$PID" | tr -d ' ')
  echo "Puerto $PORT ocupado por PID $PID ($(ps -o comm= -p "$PID")); cerrando sesión anterior..."
  kill "$PID" 2>/dev/null
  if [ -n "$PARENT" ] && ps -o cmd= -p "$PARENT" | grep -q wrangler; then
    kill "$PARENT" 2>/dev/null
  fi
done

WAITED=0
while lsof -t -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; do
  if [ "$WAITED" -ge "$MAX_WAIT_SECONDS" ]; then
    echo "No se cerró a tiempo; forzando (SIGKILL)."
    lsof -t -iTCP:"$PORT" -sTCP:LISTEN | xargs -r kill -9
    break
  fi
  sleep 1
  WAITED=$((WAITED + 1))
done
