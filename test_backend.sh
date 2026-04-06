#!/bin/bash

echo "=== TESTER JOB APPLICATION AGENT BACKEND ==="

# 1. Tjek Version
EXPECTED_VERSION=$(cat VERSION | head -n 1)
echo -n "1. Tjekker API version ($EXPECTED_VERSION)... "
VERSION=$(curl -s http://localhost:3002/api/version | grep -o "$EXPECTED_VERSION")
if [ "$VERSION" == "$EXPECTED_VERSION" ]; then echo "OK"; else echo "FEJL (Fik: $(curl -s http://localhost:3002/api/version | grep -o '\"version\":\"[^\"]*\"' | cut -d'\"' -f4))!"; fi

# 2. Tjek Brutto CV adgang
echo -n "2. Tjekker adgang til Master CV... "
CV=$(curl -s http://localhost:3002/api/brutto | grep "content")
if [ ! -z "$CV" ]; then echo "OK"; else echo "FEJL!"; fi

# 3. Tjek AI Instruktioner
echo -n "3. Tjekker AI Instruktioner... "
AI=$(curl -s http://localhost:3002/api/config/instructions | grep "REDAKTØRENS_LOGBOG")
if [ ! -z "$AI" ]; then echo "OK"; else echo "FEJL!"; fi

# 4. Tjek Live Preview (Loopback)
echo -n "4. Tjekker Live Preview system... "
PREVIEW=$(curl -s -X POST -H "Content-Type: application/json" -d '{"markdown":"# Test","type":"Ansøgning"}' http://localhost:3002/api/preview | grep "html")
if [ ! -z "$PREVIEW" ]; then echo "OK"; else echo "FEJL!"; fi

echo "=== TEST FÆRDIG ==="
