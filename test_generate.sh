#!/bin/bash
# test_generate.sh - Automatisk End-to-End test af Job Application Agent (v5.0.0)

echo "🚀 STARTER END-TO-END GENERERINGS-TEST..."

# 1. Send genererings-kald
echo -n "1. Sender job-kald til API... "
JOB_DATA='{
  "url": "https://www.coolshop.dk/jobs/",
  "jobDescription": "Software Engineer med Python erfaring til Coolshop i Nørresundby.",
  "force": true
}'

RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "$JOB_DATA" http://localhost:9001/api/generate)
JOB_ID=$(echo $RESPONSE | grep -oP '(?<="jobId":")[^"]+')

if [ -z "$JOB_ID" ]; then
    echo "FEJL! Kunne ikke starte job."
    echo "Response: $RESPONSE"
    exit 1
fi
echo "OK (Job ID: $JOB_ID)"

# 2. Vent på færdiggørelse (Polling)
echo -n "2. Venter på at AI og PDF-maskinen bliver færdig... "
MAX_ATTEMPTS=30
ATTEMPT=0
STATUS="pending"

while [ "$STATUS" != "completed" ] && [ "$ATTEMPT" -lt "$MAX_ATTEMPTS" ]; do
    sleep 5
    STATUS_RES=$(curl -s http://localhost:9001/api/jobs/status/$JOB_ID)
    STATUS=$(echo $STATUS_RES | grep -oP '(?<="status":")[^"]+')
    ATTEMPT=$((ATTEMPT+1))
    echo -n "."
done

if [ "$STATUS" != "completed" ]; then
    echo " FEJL! Jobbet blev ikke færdigt i tide eller fejlede."
    echo "Sidste status: $STATUS_RES"
    exit 1
fi
echo " OK!"

# 3. Verificer filer i output
echo "3. Verificerer genererede filer i output-mappen..."
FOLDER_NAME=$(echo $STATUS_RES | grep -oP '(?<="folderName":")[^"]+')
OUTPUT_BASE="/mnt/e/src/test/Job-Application-Agent-MGN/output/$FOLDER_NAME"

FILES=(
    "Ansøgning"
    "CV"
    "Match_Analyse"
    "ICAN+_Pitch"
)

ERROR_COUNT=0
for FILE in "${FILES[@]}"; do
    FILE_PATH=$(find "$OUTPUT_BASE" -name "${FILE}*.pdf")
    if [ -f "$FILE_PATH" ] && [ -s "$FILE_PATH" ]; then
        echo "   [✓] $FILE.pdf er genereret ($(du -h "$FILE_PATH" | cut -f1))"
    else
        echo "   [X] $FILE.pdf MANGLER eller er TOM!"
        ERROR_COUNT=$((ERROR_COUNT+1))
    fi
done

if [ $ERROR_COUNT -eq 0 ]; then
    echo "===================================================="
    echo "✅ SUCCESS: SYSTEMET ER 100% OPERATIONELT!"
    echo "===================================================="
    exit 0
else
    echo "===================================================="
    echo "❌ FEJL: Nogle filer blev ikke genereret korrekt."
    echo "===================================================="
    exit 1
fi
