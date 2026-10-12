#!/bin/bash
# ==============================================================================
# Examirror VPS Update & Deploy Script
# Run this inside /var/www/Examirror02 on your VPS whenever you push changes:
# ./scripts/deploy.sh
# ==============================================================================

set -e

echo ">>> 1. Pulling latest changes from Git..."
git pull origin main

echo ">>> 2. Building Backend..."
cd backend
npm install --production=false
npm run build
cd ..

echo ">>> 3. Building Frontend..."
cd frontend
npm install
npm run build
cd ..

echo ">>> 4. Restarting Backend via PM2..."
pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js

echo ">>> 5. Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo ">>> Deployment completed successfully for examirror.in!"
