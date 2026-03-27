# Gemini CLI Anvendelse & Fejlfinding

Dette dokument beskriver, hvordan du bruger og tester Gemini CLI direkte i Docker-containeren.

## 🤖 Aktuel Model & Version (Session Marts 2026)
For at sikre konsistens på tværs af sessions, her er de aktuelle versioner anvendt i dette projekt:
- **Model:** `gemini-2.0-flash` (Anvendes via `gemini-cli`).
- **Gemini CLI:** `v0.35.2` (Installeret globalt i Docker-containeren).
- **Node.js:** `v20.x` (LTS version i Docker).
- **Let Gemini CLI decide the best model for the task:** gemini-3.1-pro, gemini-3-flash  

## 🧪 Test af API-nøgle
Hvis du oplever fejl ved generering af dokumenter (f.eks. "Rate Limit" eller "Invalid API Key"), kan du køre denne test-kommando i din terminal. Den udtager din nøgle fra `.env_ai` og sender en simpel test-prompt til Gemini.

### Test-kommando (Gemini CLI):
```bash
docker exec -e GOOGLE_API_KEY=$(grep GEMINI_API_KEY .env_ai | cut -d'=' -f2) jaa-backend gemini -p "Hej, dette er en test af API nøglen. Svar kort."
```

### Test-kommando (CURL):
Hvis du vil teste API'et helt uafhængigt af Docker og CLI-værktøjet, kan du bruge denne `curl` kommando direkte i din terminal:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$(grep GEMINI_API_KEY .env_ai | cut -d'=' -f2)" \
    -H 'Content-Type: application/json' \
    -X POST \
    -d '{
      "contents": [{
        "parts":[{"text": "Hej, dette er en test af API nøglen via CURL. Svar kort."}]
      }]
    }'
```

### Forventet svar:
Hvis alt er sat rigtigt op, vil du se noget i stil med:
```text
Loaded cached credentials.
Both GOOGLE_API_KEY and GEMINI_API_KEY are set. Using GOOGLE_API_KEY.
API-nøglen virker korrekt. Jeg er klar til at assistere dig.
```

## 🛠️ Manuel Model-styring
Du kan også bruge kommandoen til at tjekke, hvilken model der er aktiv, eller tvinge et svar fra en bestemt model (f.eks. `gemini-1.5-flash`):

```bash
docker exec -e GOOGLE_API_KEY=$(grep GEMINI_API_KEY .env_ai | cut -d'=' -f2) jaa-backend gemini -m "gemini-1.5-flash" -p "Hvilken model er du?"
```

## 💡 Tips til Rate Limits
Hvis du får en `429 Too Many Requests` fejl:
1.  Sørg for at `GEMINI_MODEL=gemini-1.5-flash` er sat i din `.env_ai`.
2.  Vent 30-60 sekunder og prøv igen.
3.  Backenden har nu indbygget **retry-logik**, der automatisk prøver igen ved rate limits.

---
*Sidst opdateret: 26. marts 2026*
