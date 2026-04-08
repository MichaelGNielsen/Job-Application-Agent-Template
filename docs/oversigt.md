<!--
  Job Application Agent - Template Edition
  Softwaren leveres "som den er", uden nogen form for garanti.
  Brug af softwaren sker på eget ansvar.
-->

# System Oversigt & Status (v6.0.0)

Dette dokument giver et hurtigt overblik over systemets aktuelle tilstand, hvordan man tester det, og hvor man finder den tekniske dokumentation.

## 📊 Aktuel Status

| Feature | Status | Beskrivelse |
| :--- | :--- | :--- |
| **API Nøgle Tjek** | ✅ Aktiv | Frontend advarer nu, hvis nøglen mangler eller er en dummy. |
| **Selvhelende .env** | ✅ Aktiv | Opretter automatisk `.env` fra template ved opstart hvis den mangler. |
| **Robust Job-Radar** | ✅ Aktiv | Overlever korrupt JSON og manglende `radar.json`. |
| **Logging** | ✅ Aktiv | Fuld sporbarhed (prompts + svar) via `-vv` flaget (variadic logging). |
| **Swagger API** | ✅ Aktiv | Interaktiv dokumentation findes på `/api-docs` endpointet. |
| **Unit Tests** | ✅ Eksisterer | Dækker kerne-utils og RadarService logik. |

## 🧪 Testvejledning

Her er de vigtigste kommandoer til at validere at systemet kører korrekt:

### 1. Backend Unit Tests (Jest)
Kører alle logik- og utility-tests.
```bash
cd backend && npm test
```

### 2. Startup Selv-test
Tjekker AI-forbindelse og miljøet direkte i Docker-containeren.
```bash
docker exec -it jaa-backend npm start -- --self-test
```

### 3. Manuel AI Syre-test
Tester AI-køen og Gemini CLI uden om web-interfacet.
```bash
docker exec -it jaa-backend node ai_syre_test.js
```

## 📚 Dokumentations-links

| Type | Lokation | Beskrivelse |
| :--- | :--- | :--- |
| **Systemarkitektur** | [docs/architecture.md](architecture.md) | Mermaid diagram og teknisk overblik. |
| **API (Swagger)** | `http://localhost:3002/api-docs` | Interaktiv REST API dokumentation. |
| **Kode-dokumentation** | `http://localhost:3002/docs/code/index.html` | Auto-genereret JSDoc (Backend) og TypeDoc (Frontend). |
| **Feature QA** | [docs/feature_liste.md](feature_liste.md) | Checklist til manuel test og QA. |

## 🛠 Generering af ny kode-dokumentation
Hvis du har lavet store kodeændringer, kan du opdatere den tekniske dokumentation her:

- **Backend:** `cd backend && npm run docs`
- **Frontend:** `cd frontend && npm run docs`

Resultatet lander automatisk i `docs/code/`.

---
*Sidst opdateret: 8. april 2026 (v6.0.0)*
