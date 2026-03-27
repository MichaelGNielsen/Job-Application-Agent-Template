#!/bin/bash
# Master Test Script - Job Application Agent (Standardiseret v4.3.0+)
# Designer: MGN (mgn@mgnielsen.dk)

echo "===================================================="
echo "🚀 STARTER FULD SYSTEM-TEST (v4.3.0)"
echo "===================================================="

# 1. Backend Integration & Unit Tests
# Bemærk: gemini_direct.test.js (rigtigt API-kald) er nu deaktiveret for at spare tokens.
echo -e "\n[1/3] KØRER BACKEND TESTS (Unit + API Integration)..."
docker exec jaa-backend npx jest . --testPathIgnorePatterns="gemini_direct.test.js" --detectOpenHandles
if [ $? -ne 0 ]; then echo "❌ BACKEND TESTS FEJLEDE"; exit 1; fi

# 2. API Endpoint Tests (Port 3002)
echo -e "\n[2/3] KØRER API ENDPOINT-TJEK (via curl)..."
chmod +x ./test_backend.sh
./test_backend.sh
if [ $? -ne 0 ]; then echo "❌ API ENDPOINT-TJEK FEJLEDE"; exit 1; fi

# 3. Frontend Unit Tests (Port 3000)
echo -e "\n[3/3] KØRER FRONTEND UNIT-TESTS..."
docker exec jaa-frontend npm test -- --run
if [ $? -ne 0 ]; then echo "❌ FRONTEND TESTS FEJLEDE"; exit 1; fi

echo -e "\n===================================================="
echo "✅ ALLE TESTS BESTÅET - SYSTEMET ER STABILT"
echo "===================================================="
