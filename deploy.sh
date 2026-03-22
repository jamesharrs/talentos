#!/bin/bash
# Vercentic deploy script
# Usage: bash deploy.sh "your commit message"
# From: ~/projects/talentos

MSG=${1:-"deploy: $(date '+%Y-%m-%d %H:%M')"}

echo "🚀 Deploying Vercentic..."
echo "   Commit: $MSG"
echo ""

# Must be run from repo root
cd "$(dirname "$0")"

# Push to GitHub (triggers Railway auto-deploy)
git add -A
git commit -m "$MSG"
git push origin main
echo "✅ Pushed to GitHub — Railway auto-deploying"
echo ""

# Deploy Vercel
cd client
vercel --prod --yes
echo ""
echo "✅ Vercel deployed"
echo ""
echo "🌐 https://www.vercentic.com"
echo "🔌 https://talentos-production-4045.up.railway.app"
