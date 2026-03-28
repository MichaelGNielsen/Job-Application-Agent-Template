# Test-guide: Job Application Agent

Dette dokument beskriver, hvordan du verificerer, at systemet kører korrekt efter ændringer.

## 🚀 Den Ultimative Metode: System-test
Det anbefales altid at køre den fulde system-test, som verificerer både logik, API og frontend i ét hug.

### Kør alle tests

```bash
./test_all.sh
```

Dette script udfører:

1. **Backend Unit-tests:** Verificerer logik i `utils.js` (Markdown, PDF, AI-kald).
2. **API Integration:** Verificerer at Docker-containerne svarer korrekt via `curl`.
3. **Frontend Unit-tests:** Verificerer React-brugerfladen.

## 🧪 Manuelle Test-metoder

Hvis du kun vil køre dele af test-suiten:

### 1. Backend Integrationstest

Dette script tester API'et på port 3002 (v4.3.0 standard) og verificerer alle endpoints.

```bash
./test_backend.sh
```

### 2. Direkte Gemini API Test (Integration)

Denne test verificerer den faktiske forbindelse til Google Gemini API uden mocks.

```bash
docker exec jaa-backend npx jest gemini_direct.test.js
```

### 3. API Integration (Kompakt)

```bash
./test_api.sh
```

### 4. AI CV Refine Test (Log-trig)

Dette script tester AI'ens evne til at optimere et CV og genererer `[INFO2]` logs i backenden.

```bash
./test_cv_refine.sh
```

### 5. Fuld Genererings Test (Heavy Log)

Dette script starter en komplet job-generering (Ansøgning, CV, Match, Pitch) og skaber maksimal log-aktivitet.

```bash
./test_generate.sh
```

### 6. Interaktiv API Test (Swagger)

Den nemmeste måde at se og teste alle systemets endpoints på er via det indbyggede Swagger UI. Dette kræver at Docker-systemet kører.

**URL:** `http://localhost:3002/api-docs`

### 7. Backend Unit-tests (Mocks)

```bash
docker exec jaa-backend npm test
```

### 5. Frontend Unit-tests

```bash
docker exec jaa-frontend npm test
```

## ✅ Hvad testes der?

- **Backend:** Test af `utils.js` (Markdown parsing, HTML-wrapping, PDF-generering og AI-integration).
- **API:** Verificering af endpoints for CV, AI-regler og versionsstyring.
- **Frontend:** Grundlæggende React rendering og UI-komponenter med det nye tredelte layout.

---
*Se `VERSION` filen for aktuel versions-historik.*
