<!--
  Job Application Agent Template
  Designer: MGN (mgn@mgnielsen.dk)
  Copyright (c) 2026 MGN. All rights reserved.
  BEMÆRK: Denne kode anvender AI til generering og behandling.
  Brugeren skal selv verificere, at resultatet er som forventet.
  Softwaren leveres "som den er", uden nogen form for garanti.
  Brug af softwaren sker på eget ansvar.
-->

# Testvejledning - Job Application Agent Template

Dette dokument beskriver, hvordan du installerer og kører de automatiske og manuelle tests i projektet.

## 🛠️ Installationskrav

Før du kan køre tests lokalt (uden for Docker), skal du have følgende installeret på din maskine:

- **Node.js** (v18 eller nyere)
- **npm** (følger med Node.js)
- **Pandoc** (skal være i din PATH for at teste PDF/HTML-generering)

### Installer test-dependencies

For at køre tests skal du installere de nødvendige værktøjer i både backend og frontend mapperne:

```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

---

## 🚀 Automatiske Tests

Vi bruger to forskellige test-motorer til at sikre kvaliteten af både backend og frontend.

### 1. Backend (Jest)
Tester kerne-logikken, herunder HTML-wrapping, adresse-opsplitning og AI-tag håndtering.

- **Kør tests:** `cd backend && npm test`
- **Filer:** `backend/*.test.js`

### 2. Frontend (Vitest)
Tester React-komponenterne og sikrer, at UI'en render korrekt med alle nødvendige knapper og faner.

- **Kør tests:** `cd frontend && npm test`
- **Filer:** `frontend/src/**/*.test.tsx`

---

## 🔍 Manuelle Tests & Fejlfinding

### Trial Runs (Prøvekørsel)
Efter ændringer i AI-instruktioner eller design-layouts, bør du altid køre en fuld automatisering i browseren:
1. Start systemet: `docker-compose up -d --build`
2. Åbn `http://localhost:3000`
3. Indsæt et test-jobopslag og verificer det visuelle output.
### Gemini CLI Test
Du kan teste selve AI-instruktionerne direkte mod en tekstfil uden om web-interfacet:
```bash
gemini < test_prompt.txt
```

### Terminal & API Debugging (CURL)
Hvis du vil teste om API'et svarer korrekt uden at bruge browseren:

```bash
# Tjek version
curl -s http://localhost:3000/api/version

# Tjek nuværende Brutto-CV via API
curl -s http://localhost:3000/api/brutto | jq -r .content

# Trigger en generering manuelt
curl -X POST http://localhost:3000/api/generate \
-H "Content-Type: application/json" \
-d '{"jobText": "Test job...", "companyUrl": "https://test.dk"}'
```

### 📖 Interaktiv API Dokumentation (Swagger)
For et visuelt og interaktivt overblik over alle API-endpoints, kan du bruge Swagger UI:

- **URL:** `http://localhost:3000/api-docs` (når systemet kører i Docker)
- **Funktioner:** Se endpoints, datamodeller og test API'et direkte i browseren.

### Overvågning af Logs
Hvis noget går galt under en generering, kan du følge med i real-tid i Docker logs:
```bash
docker-compose logs -f backend
```


---

*Sidst opdateret: 21. marts 2026*
