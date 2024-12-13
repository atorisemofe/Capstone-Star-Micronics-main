#!/bin/bash

# Define variables
SERVER_SCRIPT="server.js"
LOG_FILE="server.log"
NGROK_URL="apt-wired-redfish.ngrok-free.app"
PORT=3000

# Start the webhook server in the background
echo "Starting the webhook server..."
nohup node $SERVER_SCRIPT > $LOG_FILE 2>&1 &
SERVER_PID=$!
echo "Webhook server started with PID $SERVER_PID. Logs are being written to $LOG_FILE."

# Start the ngrok tunnel
echo "Starting ngrok tunnel..."
nohup ngrok http --url=$NGROK_URL $PORT > ngrok.log 2>&1 &
NGROK_PID=$!
echo "Ngrok started with PID $NGROK_PID. Logs are being written to ngrok.log."

# Optionally, write the PIDs to a file for later reference
echo $SERVER_PID > webhook_server.pid
echo $NGROK_PID > ngrok.pid

echo "Startup script completed. Both services are running in the background."
