#!/bin/bash
# HUSK startup script
# Builds the frontend and starts the backend server on port 3001.
# The server serves both the built frontend and the /api endpoints.

# Build the frontend first
echo "Building frontend..."
npm run build --prefix frontend

# Start the backend server (this is the exposed port)
echo "Starting HUSK server on port 3001..."
node backend/server.js
