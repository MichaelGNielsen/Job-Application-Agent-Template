# Status Journal - Job Application Agent

Dette dokument fungerer som projektets tekniske hukommelse og strategiske roadmap. Det opdateres før hver væsentlig ændring eller commit.

## 🏁 Status 5. April 2026 (Eftermiddag) - SocketService & OpenCode API (v5.6.3) 🚀

### 🛠️ Tekniske Milepæle
- **SocketService Refactoring:** Isoleret al WebSocket (Socket.io) logik fra `server.js` til en dedikeret `SocketService.js`. Dette fuldender vores mål om at holde `server.js` udelukkende til orkestrering og afhængighedsindsprøjtning.
- **OpenCode API (Session-baseret):** Opdaget at OpenCode benytter et komplekst, asynkront session-API (`/session`) og ikke et standard REST-kald (`/api/chat`). `OpenCodeProvider.js` er nu opdateret og virker klippestabilt.
- **Workspace/Meta-Repo:** Koden er gjort 100% klar til at indgå som submodule i det nye overordnede Meta-Repository (`Job-Application-Workspace-MGN`).

---
*Sidst opdateret: 5. april 2026 (v5.6.3)*

## 🏁 Status 5. April 2026 (Morgen) - Test Refactoring & CI Fix (v5.6.2) ✅

### 🛠️ Tekniske Milepæle
- **Test Refactoring:** Splittet den forældede og store `utils.test.js` op i mindre, isolerede test-filer (`wrap.test.js`, `callLocalGemini.test.js`, `printToPdf.test.js`, osv.), der matcher den nye modulære "én funktion pr. fil"-struktur i `mgn/backend/utils/`.
- **CI/GitHub Actions Fix:** Løst problemerne med "Open Handles" og timeouts i Jest testsuiten (forårsaget af forældet mocking i den gamle struktur). `npm test` kører nu gnidningsfrit igennem (100% PASS), hvilket sikrer, at GitHub Actions (CI) bygger og validerer projektet korrekt ved push.

---
*Sidst opdateret: 5. april 2026 (v5.6.2)*

## 🏁 Status 4. April 2026 (Aften) - Lokal AI, Smart Fallback & Template Readiness (v5.6.1) 🤖🛡️

Dagen stod i robusthedens og skalerbarhedens tegn med fokus på at gøre systemet 100% uafhængigt og "template-klart".

### 🛠️ Tekniske Milepæle
- **Lokal AI Integration (Ollama):** Opsat en fuldstændig isoleret, standalone Docker-container til Ollama (`llama3.2:3b`), som systemet nu kan bruge som primær eller sekundær motor. OpenCode server blev også testet, men fravalgt for nu pga. ustabilt headless API.
- **Smart Fallback (BullMQ):** `AiManager.js` er opdateret med en robust watchdog (90s timeout) og automatisk fallback. Hvis Google Gemini (Cloud) fejler eller rammer rate limits, skifter systemet nu øjeblikkeligt og usynligt over til lokal Ollama-generering.
- **QueueEvents & Stabilitet:** Skiftet til `QueueEvents` i BullMQ for præcis job-tracking og sat `lockDuration` op til 5 minutter for at tillade tunge, lokale AI-kald uden at miste forbindelsen til Redis.
- **Ingen Hardcoding (Privacy by Design):** Alle personlige data (navn, initialer) er renset ud af `.env` og fjernet fra koden. Systemet udleder nu automatisk branding og initialer direkte fra brugerens `brutto_cv.md`. Dette gør systemet ægte "template-ready" for nye brugere. Tilføjet som officiel regel i `coding_standards.md`.
- **Utils Granularisering:** Gennemført "Én funktion pr. fil"-princippet i `mgn/backend/utils/` for maksimal overskuelighed og testbarhed (f.eks. `parseCandidateInfo.js`, `callLocalGemini.js`).
- **AI Test Endpoint:** Tilføjet `GET /api/ai/test` i Swagger, så forbindelsen til både Gemini og Ollama let kan ping-testes ("Hvad er 2+2?") direkte fra browseren.

### 🧠 Strategisk Roadmap
- Systemet er nu ekstremt modstandsdygtigt over for eksterne API-udfald.
- Fokus skifter nu til at forfine prompt-kvaliteten for de lokale LLM'er og eventuelt udbygge "Firma-Spejder" radaren.

---
*Sidst opdateret: 4. april 2026 (v5.6.1)*

## 🏁 Status 4. April 2026 - Fuld Arkitektonisk Refaktorering (BE + FE) (v5.6.0) 🏗️🚀✨

En total modernisering af både backend og frontend er nu gennemført. Systemet er gået fra at være monolitisk til at være fuldt modulært.
### 🛠️ Tekniske Milepæle (BE + FE Refaktorering)
- **Frontend Modernisering:** Al state og API-logik flyttet til Hooks og genanvendelige komponenter.
- **Backend Konsolidering:** Fuld Controller/Service arkitektur implementeret.
- **Auto-Dokumenterende Infrastruktur (JSDoc & TypeDoc):**
  - **Opdelt manual:** Dokumentation er nu fysisk adskilt i `docs/code/backend` og `docs/code/frontend` med en fælles landingsside.
  - **Asynkron generering:** JSDoc og TypeDoc genereres automatisk af Docker-containerne ved startup med 5-10s delay.
- **Swagger Robusthed:** Gennemført total fix af Swagger UI med eksplicitte `responses` og direkte JSON-specifikation for 100% stabilitet.
- **Miljø-isolering (Zero Host Dependency):**
  - Alle hårde host-stier (f.eks. `/home/mgn/`) fjernet fra Docker-konfigurationen.
  - **Single Source of Truth:** Samlet al konfiguration i én minimalistisk `.env` fil. Tidligere `.env_ai` er udfaset.
- **AiQueue (Global Stabilitet):** Indført en intern AI-kø (`utils/ai_queue.js`), der sikrer at alle Gemini-kald afvikles serielt med en tvunget cooldown. Dette eliminerer `RATE_LIMIT_EXCEEDED` fejl på tværs af server, worker og radar.
- **Konfigurerbar Startup-test:** AI selv-testen er omdøbt til `ENABLE_STARTUP_SELF_TEST` og kan nu deaktiveres via `.env`.
- **Validering:** Alle tests (BE, FE, API) bestået med dynamisk versions-validering mod `VERSION` filen.

---
*Sidst opdateret: 4. april 2026 (v5.6.0)*

- **Næste skridt:** Gennemføre den store "End-to-End" test via Swagger UI og en komplet job-generering.
- **Fokus:** Sikre at den nye modulære struktur bevares ved fremtidige udvidelser.

### ✅ Validering
- Fuldstændig build-test af frontend i Docker: `jaa-frontend npm run build` (Passed).
- API-verificering via curl (Passed).

---
*Sidst opdateret: 4. april 2026 (v5.6.0)*

## 🏁 Status 3. April 2026 - Autonom Radar & Proaktiv Crawler (v5.5.0) 🚀🎯🕵️‍♂️

En banebrydende dag, hvor Job Radaren er løftet fra en manuel liste til en fuldt autonom søgeagent, der arbejder døgnet rundt.

### 🛠️ Tekniske Milepæle (v5.4.6 -> v5.5.0)
- **Autonom Radar-Agent (Cron):** Implementeret et `setupRadarCron` i `server.js`, der planlægger et automatisk radar-tjek hver 6. time via BullMQ. Agenten arbejder nu selvstændigt i baggrunden.
- **Direct Company Crawler:** Udviklet en proaktiv crawler, der besøger specifikke virksomheders egne karrieresider (f.eks. Sky-Watch, RTX, Softcontrol). Dette omgår login-mure på jobportaler og finder "skjulte" opslag.
- **Asynkron Job-Analyse:** `POST /api/radar/job` er nu fuldt asynkron. Jobs gemmes med status `analyzing` med det samme, mens AI-scoring og metadata-udtræk sker i baggrunden via worker-processen. Giver en lynhurtig brugeroplevelse.
- **Health Check & Cleanup (🧹 Vask Liste):** Implementeret `POST /api/radar/maintenance` der pinger alle links i radaren og automatisk fjerner døde links (404) og udløbne opslag.
- **UI/UX Polering:** Tilføjet dynamiske snurretoppe (🌀) på alle kritiske knapper ("Gem", "Tilføj", "Vask") for at give brugeren real-tids feedback på baggrundsprocesser.
- **Duplicate Logic:** Forbedret dublet-tjek, så systemet nu skelner på både URL og Jobtitel, hvilket tillader overvågning af flere stillinger fra samme virksomhed på samme side (f.eks. GomSpace).
- **Chrome Bookmarklet:** Designet en "Send til Radar" knap til browserens favoritlinje, der lader brugeren sende jobbeskrivelser direkte fra lukkede sider (LinkedIn etc.) til agenten.

### 🧠 Strategisk Roadmap
- **Næste skridt:** Udvidelse af crawleren til at kunne læse PDF-filer direkte fra virksomhedssider.
- **Fokus:** Gøre agenten endnu bedre til at opdage nye virksomheder i Nordjylland helt automatisk.

### ✅ Validering
- Alle backend-endpoints (`/api/radar/*`) verificeret manuelt.
- Baggrunds-køer (BullMQ) testet og bekræftet kørende i Docker.
- Dokumentation (`docs/job_radar.md`) opdateret til v5.1.0 standard.

---
*Sidst opdateret: 3. april 2026 (v5.5.0)*

## 🏁 Status 25. Marts 2026 - Master CV & Drebin Spinner (v4.2.1) 🚀✨🎯
...
--- End of Context from: mgn/docs/journal.md ---
