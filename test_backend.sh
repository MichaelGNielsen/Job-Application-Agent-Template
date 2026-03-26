#!/bin/bash
# Integrationstest til Job Application Agent Backend (Standardiseret v4.3.0+)
# Designer: MGN (mgn@mgnielsen.dk)

echo "=== TESTER JOB APPLICATION AGENT BACKEND (v4.3.0+) ==="

API_URL="http://localhost:3002/api"

# 1. Tjek Version
echo -n "1. Tjekker API version... "
VERSION=$(curl -s $API_URL/version | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
if [ ! -z "$VERSION" ]; then echo "OK ($VERSION)"; else echo "FEJL!"; fi

# 2. Tjek Brutto CV adgang
echo -n "2. Tjekker adgang til Master CV... "
CV=$(curl -s $API_URL/brutto | grep "content")
if [ ! -z "$CV" ]; then echo "OK"; else echo "FEJL!"; fi

# 3. Tjek AI Instruktioner
echo -n "3. Tjekker AI Instruktioner... "
AI=$(curl -s $API_URL/config/instructions | grep "REDAKTØRENS_LOGBOG")
if [ ! -z "$AI" ]; then echo "OK"; else echo "FEJL!"; fi

# 4. Tjek Live Preview (Loopback)
echo -n "4. Tjekker Live Preview system... "
PREVIEW=$(curl -s -X POST -H "Content-Type: application/json" -d '{"markdown":"# Test","type":"Ansøgning"}' $API_URL/preview | grep "html")
if [ ! -z "$PREVIEW" ]; then echo "OK"; else echo "FEJL!"; fi

echo "=== TEST FÆRDIG ==="
