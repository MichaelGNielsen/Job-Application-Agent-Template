#!/bin/bash
# Integrationstest til Job Application Agent API
# Dette script tester om backend endpoints svarer korrekt.

API_URL="http://localhost:3002/api"

echo "--- STARTER API INTEGRATIONSTEST ---"

# 1. Test /version
echo -n "Tjekker /version... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/version)
if [ $STATUS -eq 200 ]; then
    VERSION=$(curl -s $API_URL/version | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    echo "OK ($VERSION)"
else
    echo "FEJL (Status: $STATUS)"
    exit 1
fi

# 2. Test /brutto
echo -n "Tjekker /brutto (CV data)... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/brutto)
if [ $STATUS -eq 200 ]; then
    echo "OK"
else
    echo "FEJL (Status: $STATUS)"
    exit 1
fi

# 3. Test /config/instructions
echo -n "Tjekker /config/instructions (AI regler)... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/config/instructions)
if [ $STATUS -eq 200 ]; then
    echo "OK"
else
    echo "FEJL (Status: $STATUS)"
    exit 1
fi

# 4. Test /config/layout
echo -n "Tjekker /config/layout (Design)... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/config/layout)
if [ $STATUS -eq 200 ]; then
    echo "OK"
else
    echo "FEJL (Status: $STATUS)"
    exit 1
fi

echo -e "\n--- API INTEGRATIONSTEST GENNEMFØRT SUCCESFULDT ---"
