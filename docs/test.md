# Test-guide: Job Application Agent

Dette dokument beskriver, hvordan du verificerer, at systemet kører korrekt efter ændringer.

## 🚀 Anbefalet metode: Test i Docker
Siden v3.2.0 er den anbefalede metode at køre testene direkte inde i Docker-containerne. Dette sikrer, at testmiljøet er 100% identisk med selve applikationen, og du behøver ikke have Node.js installeret på din maskine.

### Kør alle tests
I projektets rodmappe kan du køre det automatiske script:
```bash
./test_docker.sh
```

### Manuel kørsel af specifikke tests
Hvis du ønsker at køre dem manuelt, kan du bruge `docker exec`:

**Backend Tests:**
```bash
docker exec jaa-backend npm test
```

**Frontend Tests:**
```bash
docker exec jaa-frontend npm test
```

## 💻 Alternativ metode: Lokal kørsel (Kræver Node.js)
Hvis du har installeret Node.js lokalt og har kørt `npm install` i mapperne, kan du teste direkte:

**Backend:**
```bash
cd backend && npm test
```

**Frontend:**
```bash
cd frontend && npm test
```

## ✅ Hvad testes der?
- **Backend:** Test af `utils.js` (Markdown parsing, HTML-wrapping og API-håndtering).
- **Frontend:** Grundlæggende React rendering og UI-komponenter.

---
*Sidst opdateret: 24. marts 2026 (v3.2.0)*
