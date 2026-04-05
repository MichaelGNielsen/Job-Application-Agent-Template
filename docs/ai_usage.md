# AI Usage Guide

Dette dokument beskriver, hvordan du interagerer med de forskellige AI-tjenester i systemet.

## 1. Ollama (Lokal AI)

Ollama kører i en isoleret container på port **11435** (forskudt fra standardport 11434 for at undgå konflikt med din egen WSL installation).

### Test via CURL (WSL/Host)
Du kan teste forbindelsen direkte med følgende kald:

```bash
curl http://localhost:11435/api/generate -d '{
  "model": "llama3.2:3b",
  "prompt": "Hvad er 2+2? Svar kun med tallet.",
  "stream": false
}'
```

**Eksempel på svar:**
```json
{
  "model": "llama3.2:3b",
  "created_at": "2026-04-04T17:25:23.158948042Z",
  "response": "4",
  "done": true,
  "done_reason": "stop",
  "context": [...],
  "total_duration": 6425673911,
  "load_duration": 4690778010,
  "prompt_eval_count": 41,
  "prompt_eval_duration": 1621481228,
  "eval_count": 2,
  "eval_duration": 104676381
}
```

---

## 2. Google Gemini (Cloud AI)

Gemini kaldes via `gemini` CLI-værktøjet, som er præinstalleret i backend-containeren.

### Test via CLI (Inde i Docker)
For at teste Gemini direkte fra backend-containeren:

```bash
docker exec -it jaa-backend bash -c 'echo "Hvad er 2+2?" | gemini --model gemini-3-flash-preview'
```

### VIGTIGT: Konfiguration & API Rate Limits (GDPR / OAuth)
Gemini CLI kan køre på to måder, og dette har **stor** betydning for stabiliteten (Rate Limits):

1. **API-Nøgle (Standard):** Sættes via `GEMINI_API_KEY` i `.env`. 
   * *Problem:* I EU (pga. GDPR) er gratis API-nøgler ofte ekstremt begrænsede, og du vil hurtigt opleve `RATE_LIMIT_EXCEEDED` (selv på betalte konti, hvis de ikke er sat op som Pay-As-You-Go i Google Cloud).
2. **OAuth Login (Anbefalet Workaround):** Hvis du har logget ind på Gemini CLI lokalt på din maskine (via browser), ligger der en skjult mappe med login-credentials (`~/.gemini`). Denne token repræsenterer din faktiske brugerprofil og har langt højere kvoter.

**For at bruge OAuth (undgå Rate Limits) i Docker:**
Sørg for at din lokale `.gemini` mappe er mountet ind i backend-containeren i `docker-compose.yml`:
```yaml
    volumes:
      - ./backend:/app
      - ~/.gemini:/root/.gemini # Giver containeren adgang til dine lokale browser-credentials
```
*(Husk: For nye brugere af templaten: Kør `gemini login` lokalt på jeres host-maskine én gang, før I starter Docker-containeren, for at generere denne mappe).*

---

## 3. OpenCode (Eksperimentel AI Agent)

OpenCode har sit eget indbyggede HTTP-server API (`/session`), som `jaa-backend` forstår at tale med. For at sikre stabilitet og isolation er OpenCode flyttet ud i sin egen mappe (`opencode-server`) ved siden af projektet, ligesom Ollama.

### Kørsel via det officielle Docker Image (Anbefalet)
Vi har oprettet et samlet start-script i roden af din arbejdsmappe, der automatisk starter både Ollama og OpenCode op i baggrunden (`restart: unless-stopped`):

```bash
# Kør dette script fra rodbiblioteket:
./start_ai_servers.sh
```

Dette script starter det officielle `ghcr.io/anomalyco/opencode` image på port **4097** (forskudt fra 4096 for at undgå konflikt med WSL) og giver det adgang til din host-maskine. OpenCode-serveren lytter nu korrekt på `0.0.0.0` (alle netværk), så din backend i Docker kan ramme den via `http://host.docker.internal:4097`.

### Nativ kørsel i WSL (Alternativ)
Hvis du hellere vil køre OpenCode nativt i WSL uden om Docker:
```bash
opencode serve --port 4096 --hostname 0.0.0.0
```
*(Husk: `--hostname 0.0.0.0` er nødvendig for at Docker-containere kan ramme den).*

---

## 4. Skift af AI Provider

Du kan skifte mellem motorerne i din `.env` fil:

```env
# Brug Ollama (Lokal)
AI_PROVIDER=ollama

# Brug Gemini (Cloud)
AI_PROVIDER=gemini

# Brug OpenCode
AI_PROVIDER=opencode
```

Husk at genstarte backenden efter ændringer: `docker restart jaa-backend`.

---

## 5. Backend Test Endpoint

Systemet har en indbygget test-rute, der kan bruges via Swagger eller direkte URL:

- **Ollama:** `http://localhost:3002/api/ai/test?provider=ollama`
- **Gemini:** `http://localhost:3002/api/ai/test?provider=gemini`
- **OpenCode:** `http://localhost:3002/api/ai/test?provider=opencode`
