#!/bin/bash
# Master Test Script - Job Application Agent (v4.0.0+)
# Dette script kører samtlige tests i systemet: Unit tests (BE/FE) og API Integration.

echo "===================================================="
echo "🚀 STARTER FULD SYSTEM-TEST (v4.0.3)"
echo "===================================================="

# 1. Backend Unit Tests
echo -e "\n[1/3] KØRER BACKEND UNIT-TESTS (i jaa-backend)..."
docker exec jaa-backend npm test
if [ $? -ne 0 ]; then echo "❌ BACKEND TESTS FEJLEDE"; exit 1; fi

# 2. API Integration Tests
echo -e "\n[2/3] KØRER API INTEGRATIONSTEST (via curl)..."
chmod +x ./test_api.sh
./test_api.sh
if [ $? -ne 0 ]; then echo "❌ API INTEGRATION FEJLEDE"; exit 1; fi

# 3. Frontend Unit Tests
echo -e "\n[3/3] KØRER FRONTEND UNIT-TESTS (i jaa-frontend)..."
docker exec jaa-frontend npm test
if [ $? -ne 0 ]; then echo "❌ FRONTEND TESTS FEJLEDE"; exit 1; fi

echo -e "\n===================================================="
echo "✅ SAMTLIGE TESTS BESTÅET - SYSTEMET ER STABILT"
echo "===================================================="
