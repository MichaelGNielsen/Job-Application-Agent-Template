#!/bin/bash
# Test af FULD ansøgnings-generering (v4.3.0)
# Dette script trigger hele AI-flowet (Job-analyse, Research, Ansøgning, CV, Match-analyse, Pitch).
# Dette vil generere omfattende log-output i 'docker compose logs -f backend'.

API_URL="http://localhost:3002/api"

echo "--- STARTER FULD GENERERINGS-TEST ---"

# Test data (Michael Nielsen Identity)
JOB_TEXT="Vi søger en erfaren Senior Software Developer til at bygge fremtidens AI-løsninger. Du skal have erfaring med Node.js, Docker og AI-integration."
COMPANY_URL="http://test.com"
HINT="Fokusér på min erfaring med at bygge robuste AI-agenter"

echo "Sender anmodning om generering..."

RESPONSE=$(curl -s -X POST "$API_URL/generate" \
     -H "Content-Type: application/json" \
     -d "{
       \"jobText\": \"$JOB_TEXT\",
       \"companyUrl\": \"$COMPANY_URL\",
       \"hint\": \"$HINT\"
     }")

if [[ $RESPONSE == *"jobId"* ]]; then
    JOB_ID=$(echo "$RESPONSE" | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4)
    echo "OK: Job startet med ID: $JOB_ID"
    echo "Hold øje med 'docker compose logs -f backend' for at følge processen."
else
    echo "FEJL: Kunne ikke starte generering."
    echo "$RESPONSE"
    exit 1
fi

echo -e "\n--- GENERERINGS-TEST STARTET SUCCESFULDT ---"
