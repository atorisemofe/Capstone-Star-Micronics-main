#!/bin/bash

# Check for PID files
if [ -f "webhook_server.pid" ]; then
    SERVER_PID=$(cat webhook_server.pid)
    echo "Stopping webhook server with PID $SERVER_PID..."
    kill $SERVER_PID && echo "Webhook server stopped." || echo "Failed to stop webhook server."
    rm -f webhook_server.pid
else
    echo "Webhook server PID file not found. The server may not be running."
fi

if [ -f "ngrok.pid" ]; then
    NGROK_PID=$(cat ngrok.pid)
    echo "Stopping ngrok tunnel with PID $NGROK_PID..."
    kill $NGROK_PID && echo "Ngrok tunnel stopped." || echo "Failed to stop ngrok tunnel."
    rm -f ngrok.pid
else
    echo "Ngrok PID file not found. Ngrok may not be running."
fi

echo "Stop script completed."
