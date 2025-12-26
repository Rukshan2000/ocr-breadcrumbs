#!/bin/bash

# PWA Setup Checklist Script
# Run this to verify your PWA setup is complete

echo "================================"
echo "PWA Configuration Checklist"
echo "================================"
echo ""

# Check 1: Files exist
echo "✓ Checking files..."
files_to_check=(
  "public/manifest.json"
  "public/sw.js"
  "src/components/InstallPrompt.tsx"
  "src/components/PushNotificationManager.tsx"
  "src/app/actions.ts"
  ".env.example"
)

all_files_exist=true
for file in "${files_to_check[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (MISSING)"
    all_files_exist=false
  fi
done
echo ""

# Check 2: Dependencies
echo "✓ Checking dependencies..."
if grep -q "web-push" package.json; then
  echo "  ✅ web-push installed"
else
  echo "  ❌ web-push not in package.json"
fi
echo ""

# Check 3: Environment setup
echo "✓ Checking environment setup..."
if [ -f ".env.local" ]; then
  if grep -q "VAPID" .env.local; then
    echo "  ✅ VAPID keys configured"
  else
    echo "  ⚠️  VAPID keys not found in .env.local"
  fi
else
  echo "  ⚠️  .env.local not found (you can create it from .env.example)"
fi
echo ""

# Check 4: next.config.js
echo "✓ Checking next.config.js..."
if grep -q "headers" next.config.js; then
  echo "  ✅ Security headers configured"
else
  echo "  ❌ Security headers not found in next.config.js"
fi
echo ""

# Check 5: Layout metadata
echo "✓ Checking src/app/layout.tsx..."
if grep -q "manifest" src/app/layout.tsx; then
  echo "  ✅ Manifest referenced in layout"
else
  echo "  ❌ Manifest not referenced in layout"
fi
echo ""

# Summary
echo "================================"
echo "Setup Summary"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env.local"
echo "2. Run: npm run generate-vapid-keys"
echo "3. Add VAPID keys to .env.local"
echo "4. Run: npm run dev:https"
echo "5. Visit: https://localhost:3000"
echo ""
echo "Documentation:"
echo "- PWA_README.md - Overview and quick start"
echo "- PWA_SETUP_GUIDE.md - Detailed configuration"
echo "- PWA_COMPONENTS.md - Component reference"
echo ""
