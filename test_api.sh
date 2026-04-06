#!/bin/bash
# Integrationstest til Job Application Agent API
# Dette script tester om backend endpoints svarer korrekt.

# MASTER CONFIGURATION (Single Source of Truth)
EXPECTED_VERSION=$(cat VERSION)
# Prøv at læse port fra .env, ellers brug standard 3002
ENV_PORT=$(grep '^PORT=' .env | cut -d '=' -f2)
BACKEND_PORT=${ENV_PORT:-3002}
BASE_URL="http://localhost:$BACKEND_PORT"
API_URL="$BASE_URL/api"

echo "--- STARTER API INTEGRATIONSTEST (Port: $BACKEND_PORT, Forventet: $EXPECTED_VERSION) ---"

# 1. Test /version
echo -n "Tjekker /version... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/version)
if [ $STATUS -eq 200 ]; then
    ACTUAL_VERSION=$(curl -s $API_URL/version | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    if [ "$ACTUAL_VERSION" == "$EXPECTED_VERSION" ]; then
        echo "OK ($ACTUAL_VERSION)"
    else
        echo "FEJL! Forventede $EXPECTED_VERSION, men fik $ACTUAL_VERSION"
        exit 1
    fi
else
    echo "FEJL (Status: $STATUS)"
    exit 1
fi

# 2. Test Swagger Specifikation
echo -n "Tjekker Swagger Spec (/api-docs.json)... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api-docs.json)
if [ $STATUS -eq 200 ]; then
    SWAGGER_JSON=$(curl -s $BASE_URL/api-docs.json)
    if echo "$SWAGGER_JSON" | grep -q '"openapi":"3.0.0"'; then
        echo "OK"
    else
        echo "FEJL! Ugyldig Swagger JSON format"
        exit 1
    fi
else
    echo "FEJL (Status: $STATUS)"
    exit 1
fi

# 3. Test /brutto (CV data)
echo -n "Tjekker /brutto (CV data)... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/brutto)
if [ $STATUS -eq 200 ]; then
    echo "OK"
else
    echo "FEJL (Status: $STATUS)"
    exit 1
fi

# 4. Test /config/instructions (AI regler)
echo -n "Tjekker /config/instructions... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/config/instructions)
if [ $STATUS -eq 200 ]; then
    echo "OK"
else
    echo "FEJL (Status: $STATUS)"
    exit 1
fi

# 5. Test /config/layout (Design)
echo -n "Tjekker /config/layout... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/config/layout)
if [ $STATUS -eq 200 ]; then
    echo "OK"
else
    echo "FEJL (Status: $STATUS)"
    exit 1
fi

echo -e "\n--- API INTEGRATIONSTEST GENNEMFØRT SUCCESFULDT ---"
