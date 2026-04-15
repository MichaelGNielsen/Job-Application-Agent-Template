# Status Journal - Job Application Agent

Dette dokument fungerer som projektets tekniske hukommelse og strategiske roadmap. Det opdateres før hver væsentlig ændring eller commit.

## 🏁 Status 15. April 2026 - Fix: Robusthed i Job-Radar & AI JSON-ekstraktion (v6.2.2) 🛡️📡🤖

Fokus på at eliminere "Cannot read properties of undefined (reading 'join')" fejl i job-radaren og forbedre håndteringen af AI-modeller (især Ollama/Gemma), der ikke altid overholder JSON-formatet.

### 🛠️ Tekniske Milepæle
- **Robust Radar-Logik:** Opdateret `RadarService.js` med defensive checks og fallback-værdier for alle AI-resultater. Systemet crasher ikke længere, hvis AI'en returnerer et tomt eller fejlbehæftet objekt (f.eks. ved manglende `keywords`, `score` eller `reasons`).
- **AI Prompt Enhancement:** Implementeret automatisk prompt-forstærkning i `AiManager.js`. Når der forventes JSON, tilføjes nu ekstra strikse instruktioner ("VIGTIGT: Svar KUN med rå JSON...") specifikt for Ollama og OpenCode providers for at tvinge modellerne til korrekt formatering.
- **Udvidet Fallback-objekt:** Opdateret `AiManager.js`'s nød-fallback til at inkludere alle forventede felter (`keywords`, `reasons`, `score` etc.) som tomme arrays/standardværdier. Dette sikrer "type-safety" i resten af applikationen.
- **Unit Testing:** Tilføjet en ny test-case til `RadarService.test.js`, der specifikt verificerer at systemet overlever et fejlbehæftet AI-svar uden at kaste exceptions.
- **Bug Fix (Unit Tests):** Rettet en metodenavn-mismatch i `RadarService.test.js` (`_getAiPrefs` -> `_getAiSettings`), så alle tests nu passerer igen.
- **Versionsløft:** Opdateret systemet til `v6.2.2`.

### 🧠 Strategisk Roadmap
- **Prioritet 1:** Overvåge Ollama loggen for at se om de nye prompt-instruktioner forbedrer JSON-raten hos Gemma og Llama modellerne.
- **Prioritet 2:** Synkronisere disse robustheds-rettelser til Template-mappen.

---
*Sidst opdateret: 15. april 2026 (v6.2.2)*


## 🏁 Status 14. April 2026 - Fix: AI Model-parameter gennemslagskraft (v6.2.1) 🎯🤖⚡

Fokus på at sikre, at brugerens valgte AI-model (f.eks. en specifik Ollama model) rent faktisk bliver brugt i alle trin af genereringen. Tidligere blev denne parameter tabt i `ApplicationService`, hvilket førte til uønskede fallbacks til default-modeller eller Gemini.

### 🛠️ Tekniske Milepæle
- **Parametrisk Integritet:** Opdateret `ApplicationService.js` til korrekt at ekstrahere `aiModel` fra job-køen og sende den videre til alle underliggende `aiManager.call` kald.
- **Initial & Refine Flow:** Både sprogdetektering, firma-research og de fire trin i ansøgningsgenereringen respekterer nu den valgte model.
- **API Test Opgradering:** Opdateret `/api/ai/test` i `ApplicationController.js` til at acceptere en `model` query-parameter, så man nu kan teste specifikke modeller direkte via Swagger eller URL (f.eks. `?provider=ollama&model=qwen3.5:27b`).
- **Robust AI Preference Resolution:** Radar-servicen er nu opgraderet til altid at resolve den korrekte model fra `ai_preferences.json`, selv når provideren står til "default". Dette sikrer, at dine model-valg i UI'en (f.eks. en specifik Ollama eller Gemini model) altid vinder over de hårde defaults i `.env`.
- **AI Model Metadata:** Opdateret `AiManager.js` og alle providers til at returnere metadata om den anvendte model. `/api/ai/test` returnerer nu det faktiske modelnavn (f.eks. `gemma2:9b` eller `gemini-3.1-flash-lite-preview`) i stedet for blot "default".
- **Loging Stack-Trace & Alignment Fix:** Rettet fejl i `logger.js`, hvor filnavn og linjenummer altid pegede på selve loggeren. Nu captures den korrekte stack-depth. Padding på både funktionsnavn og filnavn er øget til 20 tegn for at sikre perfekt vertical alignment og undgå truncation af lange navne som `OpenCodeProvider` og `ApplicationService`.
- **Ollama Error Feedback:** Forbedret fejlhåndtering i `OllamaProvider.js`, så specifikke fejlbeskeder (f.eks. "model requires more system memory") nu bliver udtrukket og logget mere læsbart i stedet for at vise rå JSON-støj.
- **Logning:** Tilføjet logning af den valgte model i `ApplicationController` og `ApplicationService` for bedre gennemsigtighed under fejlfinding.
- **Versionsløft:** Opdateret systemet til `v6.2.1`.

### 🧠 Strategisk Roadmap
- **Prioritet 1:** Verificere at de tungere Ollama modeller (f.eks. 27b+) kører stabilt gennem kø-systemet uden timeouts.
- **Prioritet 2:** Synkronisere disse rettelser til Template-mappen for at sikre konsistens.

---
*Sidst opdateret: 14. april 2026 (v6.2.1)*


## 🏁 Status 13. April 2026 - Major Update: Memory, Context & Skills Triade (v6.2.0) 🧠🧭🛠️

Fokus på at styrke AI-agentens hukommelse og arbejdskontekst gennem et struktureret dokumentationshierarki. Dette forbedrer evnen til at fastholde komplekse arkitektoniske valg og genbruge specialiserede procedurer.

### 🛠️ Tekniske Milepæle
- **Implementering af Hukommelseshierarki:** Oprettet tre nye styrende filer i `docs/`:
    - `memory.md`: Til langsigtede arkitektoniske beslutninger (f.eks. tidszone-håndtering og port-standarder).
    - `context.md`: Til her-og-nu status, aktive opgaver og fokusområder.
    - `skills.md`: Til opsamling af komplekse tekniske procedurer (f.eks. Docker port-cleanup og test-flows).
- **Workflow-integration:** Opdateret `GEMINI.md` med strikse instrukser til AI-agenten om proaktivt at læse og opdatere dette hierarki ved hver session/opgave.
- **Link-konsistens:** Opdateret `README.md` med direkte links til de nye dokumenter under sektionen "Udvikler-dokumentation".
- **Versionsløft:** Opdateret systemet til `v6.2.0` for at markere denne væsentlige arkitektoniske forbedring af AI-samarbejdet.

### 🧠 Strategisk Roadmap
- **Prioritet 1:** Anvende det nye hierarki til at løse komplekse refactoring-opgaver mere præcist.
- **Prioritet 2:** Udrulle "Trial Run" med den nye logning for at finjustere søgeords-generering.

---
*Sidst opdateret: 13. april 2026 (v6.2.0)*


Fokus på at give et hurtigt og letforståeligt overblik over systemets teknologier og struktur for nye brugere og agenter.

### 🛠️ Tekniske Milepæle
- **Nyt Dokument: Teknisk Overblik:** Oprettet `docs/tech_stack.md`, der opsummerer systemets kerne-teknologier (Node.js, React, BullMQ, Redis, Chromium, Pandoc) og mappestruktur på en letfordøjelig måde.
- **Bekræftelse af Sprog-stack:** Eksplicit dokumenteret at projektet er 100% JavaScript/TypeScript-baseret og **ikke** indeholder Python-kode.
- **Link-integration:** Opdateret `README.md` og `docs/oversigt.md` med direkte links til det nye tekniske overblik for bedre navigation.
- **Versionsstyring:** Opdateret systemversionen til `v6.1.2` i `VERSION`, `README.md` og relevante dokumenter.

### 🧠 Strategisk Roadmap
- **Prioritet 1:** Gennemføre "Trial Run" med den nye logning for at finjustere søgeords-generering.
- **Prioritet 2:** Implementere tooltips (hover-tekst) som planlagt i v6.0.0.

---
*Sidst opdateret: 9. april 2026 (v6.1.2)*


## 🏁 Status 8. April 2026 (Aften) - Fix: Dokumentations-links & Statisk Servering (v6.1.1) 🛠️📚✨

Fokus på at gøre den tekniske kodedokumentation (JSDoc/TypeDoc) tilgængelig og funktionel direkte via backenden.

### 🛠️ Tekniske Milepæle
- **Statisk Servering af Docs:** Tilføjet en ny route i `server.js` (`app.use('/docs', ...)`), der gør det muligt for backenden at servere dokumentations-mappen. Dette løser problemer med CORS-blokering af menu-indlæsning, når man åbnede filerne direkte fra filsystemet.
- **Link-reparation i Oversigt:** Opdateret `docs/oversigt.md` til at pege på den korrekte web-URL (`http://localhost:3002/docs/code/index.html`) i stedet for det relative filsystem-link.
- **Backend Robusthed:** Verificeret at statisk servering fungerer korrekt sammen med eksisterende `/api/applications` route.

### 🧠 Strategisk Roadmap
- **Prioritet 1:** Gennemføre "Trial Run" med den nye logning for at finjustere søgeords-generering.
- **Prioritet 2:** Implementere tooltips (hover-tekst) som planlagt i v6.0.0.

---
*Sidst opdateret: 8. april 2026 (v6.1.1)*


## 🏁 Status 8. April 2026 - Major Update: Selvheling & Robusthed (v6.1.0) 🛡️🩹🚀

Fokus på at gøre systemet "skudsikkert" ved opstart og første kørsel gennem automatisk fil-generering og forbedret UI-konfiguration.

### 🛠️ Tekniske Milepæle
- **Selvhelende Data-radar:** `RadarService` kan nu selv generere en korrekt `radar.json` fil hvis den mangler, og overlever korrupt JSON via dyb merging af standard-værdier.
- **Selvhelende Environment:** Implementeret `ensureEnvExists` utility der automatisk opretter en `.env` fra `.env_template` ved opstart af server eller worker.
- **API Nøgle Management:** Tilføjet ny fane 'Indstillinger' i frontend, hvor brugeren kan indtaste sin Gemini API nøgle. Denne gemmes i `ai_preferences.json` og overstyrer dummy-værdier i `.env`.
- **UI Advarselssystem:** Implementeret pulsende advarsel i toppen af applikationen hvis API-nøglen mangler eller er ugyldig.
- **Logging Opgradering:** Gennemført totalrenovering af logging-systemet. Nu logges fulde prompts, rå AI-svar, rensede svar og præcis eksekveringstid (ms) for alle AI-kald.
- **Robusthedstests:** Oprettet og kørt `integration_robustness.test.js` (sikker tilstand) for at verificere selvheling uden at røre ved aktive filer.

### 🧠 Strategisk Roadmap
- **Prioritet 1:** Gennemføre "Trial Run" med den nye logning for at finjustere søgeords-generering.
- **Prioritet 2:** Implementere tooltips (hover-tekst) som planlagt i v6.0.0.

---
*Sidst opdateret: 8. april 2026 (v6.1.0)*


## 🏁 Status 7. April 2026 - Major Release: Arkitektur & UI/UX Optimering (v6.0.0) 🧭🏗️🚀

Fokus på at bringe dokumentationen (architecture.md) up-to-date med den faktiske implementering og forberede UI'en til hover-tekst.

### 🛠️ Tekniske Milepæle
- **Arkitektur Audit:** Gennemgået og opdateret `docs/architecture.md` med nyt Mermaid-diagram, der viser den dobbelte kø-struktur (`job_queue` og `ai_call_queue`).
- **Resilient AI-Parsing:** Implementeret `_cleanJson` i `AiManager.js` for at håndtere fejlbehæftede JSON-svar fra mindre AI-modeller automatisk.
- **Radar Template:** Oprettet `data/radar.json_template` for at gøre systemet nemmere at sætte op fra bunden.
- **UI/UX Roadmap:** Tilføjet opgave om hover-tekst (tooltips) og reduktion af ekstern dokumentation til `TODO.md`.
- **Telemetri Guide:** Dokumenteret hvordan `Error flushing log events` fra Gemini CLI (HTTP 400) kan ignoreres eller deaktiveres via `GEMINI_TELEMETRY_ENABLED=false`.

### 🧠 Strategisk Roadmap
- **Prioritet 1:** Implementere hover-tekst på alle knapper i frontend for at gøre systemet mere selvforklarende.
- **Prioritet 2:** Reducere mængden af redundant tekst i `docs/` mapperne.

---
*Sidst opdateret: 7. april 2026 (v6.0.0)*


## 🏁 Status 5. April 2026 (Aften) - Fuld Formatering & Oprydning (v5.6.7) 🧹✨
... rest of file ...

### 2026-04-06
- Rettet PDF-generering (printToPdf.js) med bedre validering og fejlhåndtering.
- Implementeret fallback-kæde: Gemini -> OpenCode -> Ollama i AiManager.
- Opdateret .env til gemini-3.1-flash-lite-preview.

### 2026-04-07 (Senere)
- Integreret AI Model Vælger i `RadarService`. Job-radar bruger nu automatisk den AI-model, som brugeren har valgt i interfacet via `data/ai_preferences.json`.
- Refaktoreret `RadarService` til at læse bruger-præferencer centralt før alle AI-kald (`refresh`, `_scoreJob`, `analyzeJob`).

### 2026-04-07
- Tilføjet `searchKeywords` konfiguration til `radar.json` for at forbedre søgekvaliteten i 'Søg nye job'.
- Opdateret `RadarService.js` til at inkludere disse søgeord i AI-prompten ved generering af søgeforespørgsler.
- Verificeret med backend/frontend tests.


- Rettet manual edit PDF-generering: Sender nu fil-sti i stedet for HTML-indhold.
- Forbedret sektions-ekstraktion med tolerance overfor AI-mærkat variationer.
- Implementeret intelligent 'Start Automatisering' knap der tjekker for tekst-ændringer.
- Rettet unit tests (printToPdf og generateMasterDocs) til at matche ny robustheds-logik.

### 2026-04-06
- Implementeret 'Den Strategiske Pipeline' (Arkitektur v6.0+): 4-trins sekventiel AI-generering (Match -> CV -> Ansøgning -> ICAN+) for at sikre stærk 'rød tråd'.
- Dokumenteret pipelinen i docs/strategiske_pipeline.md.
- Adskilt job data og brødtekst fuldstændig: Metadata gemmes nu i job_data.json, og .md filer er 100% ren tekst.
- Forenklet frontend editoren (fjernet meta-view) da AI'en ikke længere forvirres over metadata tags ved manuelle rettelser eller AI-forfinelser.

### 2026-04-06
- Oprettet timeUtils.js til at håndtere korrekt lokal tidszone (CEST/CET) i stedet for UTC.
- Opdateret system-logger og mappe-navngivning til at bruge den korrekte, lokale tid.

### 2026-04-06
- Oprettet Feature & Test Checklist (QA) i docs/feature_liste.md.
- Implementeret 'Drebin Spinner' (visuel feedback) på 'AI Forfin' knappen i ResultSection.

### 2026-04-06
- Tilføjet 'Kode & Arkitektur Regler' til feature_liste.md for at beskytte 'Lokal Tidszone (TS) via timeUtils.js' og 'Rene Markdown Filer' principperne fremadrettet.

### 2026-04-06
- Opdateret rækkefølgen af AI-modeller i 'AI model vælger' dropdown til Gemini -> OpenCode -> Ollama.

### 2026-04-06
- Implementeret persistent lagring af AI-præferencer (provider + model) i data/ai_preferences.json.
- Frontend husker nu automatisk det sidst valgte model-valg pr. provider.

### 2026-04-07 (Senere)
- Implementeret unit testing for RadarService (RadarService.test.js).
- Verificeret fuld funktionalitet af AI-model valg og søgeords-logik via test-suite.

### 2026-04-07 (Fix)
- Rettet fejl i RadarService hvor hele præference-objektet blev sendt til AiManager i stedet for provider-navnet.
- Opdateret RadarService til korrekt at overføre 'activeProvider' og 'activeModel' fra data/ai_preferences.json.

### 2026-04-07 (Test Fix)
- Rettet timeout fejl i RadarService unit test ved at mocke søge-funktionen, så Chromium ikke startes under test-afvikling.

### 2026-04-07 (Senere endnu)
- Gjorde score-tærsklen konfigurerbar via 'minScore' i radar.json.
- Opdateret RadarService til at bruge denne tærskel i stedet for en hårdkodet værdi på 80.

### 2026-04-07 (JSON Fix)
- Implementeret resilient JSON-parsing i AiManager.js.
- Tilføjet automatisk rensning af trailing commas, manglende kommaer og ulovlige newlines i AI-svar.
