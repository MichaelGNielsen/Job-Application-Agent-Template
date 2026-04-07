# Status Journal - Job Application Agent

Dette dokument fungerer som projektets tekniske hukommelse og strategiske roadmap. Det opdateres før hver væsentlig ændring eller commit.

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
- Oprydning af personlige MGN/Michael referencer og rebranding til Job-Application-Agent-Template.
- Gendannelse af Tintin test-data i CV-filer.
- Neutralisering af dokumentations-headers.
- Opdatering af stier til relative stier i scripts.
