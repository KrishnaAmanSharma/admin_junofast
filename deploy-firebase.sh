#!/bin/bash

echo "Building Juno Fast for Firebase Hosting..."

# Build the frontend
echo "Step 1: Building frontend..."
npm run build

# Deploy to Firebase
echo "Step 2: Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo "Deployment complete! Your app is now live on Firebase."