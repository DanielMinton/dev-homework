#!/bin/bash
# Railway Deployment Script for Monorepo
# This script sets up all services for the dev-homework project

set -e

echo "=== Railway Deployment Setup ==="
echo ""

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "Please log in to Railway:"
    railway login
fi

echo ""
echo "=== Step 1: Create Project ==="
echo "Creating new Railway project..."
railway init --name dev-homework-app

PROJECT_ID=$(railway status --json 2>/dev/null | grep -o '"projectId":"[^"]*"' | cut -d'"' -f4)
echo "Project created: $PROJECT_ID"

echo ""
echo "=== Step 2: Add PostgreSQL Database ==="
railway add --database postgres
echo "Waiting for database to provision..."
sleep 10

echo ""
echo "=== Step 3: Deploy Backend ==="
cd "$(dirname "$0")/../backend"
railway link --environment production
railway up --detach
BACKEND_URL=$(railway domain 2>/dev/null || echo "pending")
echo "Backend deploying... URL will be: $BACKEND_URL"

echo ""
echo "=== Step 4: Deploy Frontend ==="
cd "$(dirname "$0")/../frontend"
railway link --environment production
railway variables --set "NEXT_PUBLIC_API_URL=https://$BACKEND_URL"
railway up --detach
FRONTEND_URL=$(railway domain 2>/dev/null || echo "pending")
echo "Frontend deploying... URL will be: $FRONTEND_URL"

echo ""
echo "=== Deployment Initiated ==="
echo ""
echo "Check status at: https://railway.app/dashboard"
echo ""
echo "Once deployed:"
echo "  Backend:  https://$BACKEND_URL"
echo "  Frontend: https://$FRONTEND_URL"
echo ""
echo "Don't forget to set OPENAI_API_KEY in the backend service variables!"
