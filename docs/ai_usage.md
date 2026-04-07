# AI Usage Guide

Dette dokument beskriver, hvordan du interagerer med de forskellige AI-tjenester i systemet.

## 1. Oversigt over AI Modeller

Systemet understøtter tre primære AI-udbydere, som kan vælges dynamisk i interfacet via **AI Model Vælger**.

| Provider | Type | Forbindelse | Primær Model |
| :--- | :--- | :--- | :--- |
| **Google Gemini** | Cloud | `gemini` CLI | `gemini-2.5-flash` |
| **OpenCode** | Lokal / LAN | HTTP API | `agent` |
| **Ollama** | Lokal | HTTP API | `llama3.2` |

---

## 2. Google Gemini (Cloud AI)

Gemini kaldes via `gemini` CLI-værktøjet, som er præinstalleret i backend-containeren.

### Test via CLI (Inde i Docker)
For at teste Gemini direkte fra backend-containeren:

```bash
docker exec -e GEMINI_TELEMETRY_ENABLED=false -it jaa-backend bash -c 'echo "Hvad er 2+2? Svar kun med tallet." | gemini --model gemini-2.5-flash-lite'
```

### API Rate Limits & OAuth (VIGTIGT)
For at undgå Rate Limits i EU (GDPR begrænsninger på gratis nøgler), anbefales det at bruge **OAuth Login**:
1. Kør `gemini login` lokalt på din maskine.
2. Sørg for at `~/.gemini` mappen er mountet ind i Docker (allerede sat op i `docker-compose.yml`).
3. Dette giver langt højere kvoter end en standard API-nøgle.

---

## 3. OpenCode AI Server

OpenCode fungerer som en centraliseret AI-backend for det lokale netværk. Den bruger et session-baseret API.

### Test via CURL (2 skridt)

- 1 Opret en session

```bash
# get session_id
curl -X POST http://localhost:4096/session

# Returnerer: {"id": "ses_298d6b436ffel6jV25M4XINmXf"}
{"id":"ses_298d6b436ffel6jV25M4XINmXf","slug":"neon-eagle","version":"1.3.15","projectID":"global","directory":"/","title":"New session - 2026-04-07T08:57:32.873Z","time":{"created":1775552252873,"updated":1775552252873}}
```

- 2 Send besked (erstat ID)

```bash
# send spørgsmål med session_id fra forrige kald
curl -X POST http://localhost:4096/session/ses_298d6b436ffel6jV25M4XINmXf/message -H "Content-Type: application/json" -d '{ "parts": [{ "type": "text", "text": "Hvad er 2+2? Svar kun med tallet." }] }'

# svar fra opencode
{"info":{"parentID":"msg_d672b7427001acTSW7j2mpg4hY","role":"assistant","mode":"build","agent":"build","path":{"cwd":"/","root":"/"},"cost":0,"tokens":{"total":11197,"input":65,"output":28,"reasoning":0,"cache":{"write":10594,"read":510}},"modelID":"big-pickle","providerID":"opencode","time":{"created":1775552394283,"completed":1775552402412},"finish":"stop","id":"msg_d672b742b001tOQeoDhKlzvIqA","sessionID":"ses_298d6b436ffel6jV25M4XINmXf"},"parts":[{"type":"step-start","id":"prt_d672b91280015YPIXZUKAo027A","sessionID":"ses_298d6b436ffel6jV25M4XINmXf","messageID":"msg_d672b742b001tOQeoDhKlzvIqA"},{"type":"reasoning","text":"The user is asking \"What is 2+2?\" in Danish and wants only the number as the answer.","time":{"start":1775552401707,"end":1775552402310},"metadata":{"anthropic":{"signature":"395c9e87e846b1884de8c9676fe7e4ab42016d7ba4aa39b7248a6b864803f9d9"}},"id":"prt_d672b912b001lDenaYbq6R9Vr6","sessionID":"ses_298d6b436ffel6jV25M4XINmXf","messageID":"msg_d672b742b001tOQeoDhKlzvIqA"},{"type":"text","text":"4","time":{"start":1775552402319,"end":1775552402319},"id":"prt_d672b9386002jZ7uzkqWWWGqdc","sessionID":"ses_298d6b436ffel6jV25M4XINmXf","messageID":"msg_d672b742b001tOQeoDhKlzvIqA"},{"reason":"stop","type":"step-finish","tokens":{"total":11197,"input":65,"output":28,"reasoning":0,"cache":{"write":10594,"read":510}},"cost":0,"id":"prt_d672b93e6001VJE2dDqoceW2x2","sessionID":"ses_298d6b436ffel6jV25M4XINmXf","messageID":"msg_d672b742b001tOQeoDhKlzvIqA"}]}
```

---

## 4. Ollama (Lokal AI)

Ollama bruges til kørsel af open-source modeller som Llama 3 eller Mistral.

### Test via CURL

```bash
# ai curl kald
 curl http://localhost:11434/api/generate -d '{"model": "gemma3:4b", "prompt": "Hvad er 2+2? Svar kun med tallet.", "stream": false }'

# ai svar
{"model":"gemma3:4b","created_at":"2026-04-07T08:21:44.503172224Z","response":"4\n","done":true,"done_reason":"stop","context":[105,2364,107,236814,38023,2087,236743,236778,236862,236778,236881,555,1967,11993,1470,5883,1184,236761,106,107,105,4368,107,236812,107],"total_duration":3130194052,"load_duration":2946774945,"prompt_eval_count":24,"prompt_eval_duration":79152168,"eval_count":3,"eval_duration":74516519}
```

---

## 5. Dynamisk AI Valg & Fallback

Du behøver ikke længere rette i `.env` for at skifte AI. Brug dropdown-menuen i interfacet:
- **Auto Mode:** Systemet starter med Gemini. Hvis den fejler (rate limit), prøver den automatisk **OpenCode**, og derefter **Ollama**.
- **Model Hukommelse:** Systemet husker din valgte model pr. provider (gemt i `data/ai_preferences.json`).

---

## 6. Overvågning af AI Svar

For at se præcis hvad AI'en svarer (fejlsøgning af JSON-format etc.), kan du bruge systemets variadic logging:

```bash
# Se resume af AI svar
# Se FULDE rå AI svar (kræver VERBOSE=-vv i .env)
docker compose logs -f backend
# Se FULDE rå AI svar (kræver VERBOSE=-vv i .env)
docker compose logs -f backend
```

*Bemærk: Se **[coding_standards.md](coding_standards.md)** for mere info om det gyldne princip for logging.*
