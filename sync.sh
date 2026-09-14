#!/bin/bash
git add .
git commit -m "Auto-sync update: $(date '+%Y-%m-%d %H:%M:%S')"
git push origin main
echo "✅ Code successfully synced to GitHub!"
