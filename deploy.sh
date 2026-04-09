#!/bin/bash
# HealTunes Deploy Script
# Usage: VERCEL_TOKEN=xxx ./deploy.sh
# Get your token from: https://vercel.com/account/tokens

if [ -z "$VERCEL_TOKEN" ]; then
  echo "❌ Set VERCEL_TOKEN first: VERCEL_TOKEN=xxx ./deploy.sh"
  exit 1
fi

echo "🚀 Deploying HealTunes to Vercel..."
vercel deploy --prod --yes --token "$VERCEL_TOKEN"

if [ $? -eq 0 ]; then
  echo "✅ Deployed! https://med-moments-site.vercel.app"
else
  echo "❌ Deployment failed!"
  exit 1
fi
