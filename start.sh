#!/bin/bash
cd "$(dirname "$0")"

uvicorn backend.main:app --reload &
BACKEND_PID=$!

cd frontend && npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
