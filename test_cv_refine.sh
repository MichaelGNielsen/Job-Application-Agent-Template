#!/bin/bash
# Test af AI CV Refine endpoint (v4.3.0)
# Dette script sender et simpelt CV til AI'en for at få det optimeret.
# Dette vil trigge log-output i 'docker compose logs -f backend'.

API_URL="http://localhost:3002/api"

echo "--- STARTER AI CV REFINE TEST ---"

# Simpelt test CV
CV_CONTENT="# Navn: Tintin\n## Erfaring\nUndersøgende journalist på Le Petit Vingtième. Rejser meget til Congo, Tibet og Månen."
HINT="Gør det mere formelt og professionelt"

echo "Sender CV til optimering..."

RESPONSE=$(curl -s -X POST "$API_URL/brutto/refine" \
     -H "Content-Type: application/json" \
     -d "{
       \"content\": \"$CV_CONTENT\",
       \"hint\": \"$HINT\"
     }")

if [[ $RESPONSE == *"refined"* ]]; then
    echo "OK: AI optimering gennemført."
    echo -e "\n--- REDAKTØRENS LOGBOG ---\n"
    echo "$RESPONSE" | grep -o '"log":"[^"]*"' | cut -d'"' -f4 | sed 's/\\n/\n/g'
else
    echo "FEJL: Kunne ikke optimere CV."
    echo "$RESPONSE"
    exit 1
fi

echo -e "\n--- AI CV REFINE TEST GENNEMFØRT ---"
