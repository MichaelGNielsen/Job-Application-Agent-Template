# Test-guide: Job Application Agent

Dette dokument beskriver, hvordan du verificerer, at systemet kører korrekt efter ændringer.

## 🚀 Den Ultimative Metode: System-test
Siden v4.0.0 er den anbefalede metode at køre den fulde system-test, som verificerer både logik, API og frontend i ét hug.

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

### 1. Kun API Integration
```bash
./test_api.sh
```

### 2. Kun Backend Unit-tests
```bash
docker exec jaa-backend npm test
```

### 3. Kun Frontend Unit-tests
```bash
docker exec jaa-frontend npm test
```

## ✅ Hvad testes der?
- **Backend:** Test af `utils.js` (Markdown parsing, HTML-wrapping, PDF-generering og AI-integration).
- **API:** Verificering af endpoints for CV, AI-regler og versionsstyring.
- **Frontend:** Grundlæggende React rendering og UI-komponenter med det nye tredelte layout.

---
*Sidst opdateret: 24. marts 2026 (v4.0.3)*

