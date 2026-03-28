# Status Journal - Job Application Agent

Dette dokument fungerer som projektets tekniske hukommelse og strategiske roadmap. Det opdateres før hver væsentlig ændring eller commit.

## 🏁 Status 28. Marts 2026 - Debugging, Robusthed & AI-Log-Triggers (v4.3.0) 🧪🚀✨

En dag med fokus på at gøre systemet mere robust over for store datamængder og gøre debugging lettere via API-baserede test-scripts.

### 🛠️ Tekniske Milepæle (v4.2.6 -> v4.3.0)
- **Robust AI-kald (v4.3.0):** Løst en kritisk fejl (`stderr maxBuffer length exceeded`) i `backend/utils.js`. Ved at hæve buffer-grænsen fra 1MB til 50MB i `execPromise`, kan systemet nu håndtere meget store AI-outputs og detaljerede logs uden at crashe.
- **Centrale Log-Triggers:** Oprettet to nye API-baserede test-scripts, der gør det muligt at se "rigtige" logs i `docker compose logs -f backend`:
    - `test_cv_refine.sh`: Tester AI-optimering af et CV.
    - `test_generate.sh`: Trigger en komplet job-generering (Ansøgning, CV, Match, Pitch) for at teste hele flowet.
- **Master Test-Suite Opdatering:** `test_all.sh` er nu opgraderet til en 4-trins proces, der inkluderer den nye `test_cv_refine.sh` for at sikre, at AI'en altid svarer korrekt før en commit.
- **Centraliseret Debug-konfiguration:** Flyttet `DEBUG=true` og `VERBOSE=-vv` fra `docker-compose.yml` til den centrale `.env` fil for at holde orkestrerings-filen ren og overskuelig.
- **Docker Autentificering:** Tilføjet volume-mount af `/home/mgn/.gemini:/root/.gemini` i både MGN og Template repositories. Dette sikrer, at Gemini CLI'ens login-session (betalt profil) følger med ind i containeren. Dokumentationen i `docs/docker_setup.md` er opdateret med en forklaring på dette.

### ✅ Validering
- Alle 11 backend-tests bestået inde i Docker (inkl. de nye integrationstests).
- `test_generate.sh` bekræftet fungerende med fuldt PDF-output for alle 4 dokumenter.
- `maxBuffer` rettelse verificeret ved tunge AI-kald (>30 sekunder).
- Versionsnummer opdateret til v4.3.0 i både MGN og Template repositories.

---

## 🏁 Status 27. Marts 2026 - Miljø-fil Standardisering (.env) (v4.2.6) 🛠️🚀✨
... (resten af journalen bevares)
