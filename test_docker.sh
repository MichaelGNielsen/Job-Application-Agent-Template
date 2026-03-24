#!/bin/bash
# Test Script til Job Application Agent (Docker version)

echo "--- KØRER BACKEND TESTS (i jaa-backend container) ---"
docker exec jaa-backend npm test

echo -e "\n--- KØRER API INTEGRATIONSTEST (via curl) ---"
./test_api.sh

echo -e "\n--- KØRER FRONTEND TESTS (i jaa-frontend container) ---"
docker exec jaa-frontend npm test

echo -e "\n--- TEST KØRSEL FÆRDIG ---"
