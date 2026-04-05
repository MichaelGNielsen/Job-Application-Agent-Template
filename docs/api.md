# API Dokumentation: Job Application Agent

Dette dokument beskriver systemets API-arkitektur, hvordan du bruger Swagger UI til test, og hvordan du interagerer med backenden programmatisk.

## 🚀 Swagger UI (Interaktiv Dokumentation)
Systemet har indbygget Swagger, som automatisk dokumenterer alle controllere og ruter.

- **URL:** [http://localhost:3002/api-docs](http://localhost:3002/api-docs)
- **Funktion:** Her kan du se alle endpoints, deres forventede input (JSON) og teste dem direkte i browseren via "Try it out".

## 🏗️ API Struktur
Backenden følger en **Controller/Service** arkitektur:
- **Controllers:** Håndterer HTTP requests/responses (placeret i `backend/controllers/`).
- **Services:** Indeholder selve forretningslogikken (placeret i `backend/services/`).

### Hovedkategorier
1. **Radar (`/api/radar`):** Håndtering af job-søgning, crawling og match-scoring.
2. **Applications (`/api/generate`):** Orkestrering af AI-generering af ansøgninger og CV'er.
3. **Config (`/api/version`, `/api/brutto`):** Håndtering af Master CV og system-indstillinger.

## 🛠️ Manuel brug via CLI (curl)
Du kan også tale med API'et direkte fra din terminal.

### Hent system version
```bash
curl -s http://localhost:3002/api/version
```

### Tilføj et job til radaren
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"url": "https://link-til-job.dk"}' \
  http://localhost:3002/api/radar/job
```

### Start generering af ansøgning
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"jobText": "...", "companyUrl": "...", "hint": "..."}' \
  http://localhost:3002/api/generate
```

## 📡 WebSockets (Socket.io)
Systemet bruger WebSockets til real-tids statusopdateringer under AI-generering.
- **Namespace:** `/`
- **Events:**
  - `join_job (jobId)`: Tilslut dig en specifik genererings-proces.
  - `job_status_update`: Modtag løbende status fra worker-processen.

---
*Sidst opdateret: 4. april 2026 (v5.6.0)*
