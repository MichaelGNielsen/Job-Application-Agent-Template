# Feature & Test Checklist (v6.0+)

Dette dokument bruges til at validere og kvalitetssikre (QA) funktionerne i Job Application Agenten. Brug dette som en tjekliste for at sikre, at systemet opfører sig som forventet under forskellige scenarier.

## 🟢 Kernefunktionalitet (The Strategic Pipeline)
- [x] **Ny Job-Generering (4-Trins Pipeline):** Systemet eksekverer Match -> CV -> Ansøgning -> ICAN+ sekventielt. Resultatet hænger logisk sammen ("Den Røde Tråd").
- [x] **Hastighed:** De 4 mindre AI-jobs afvikles hurtigt (ofte hurtigere samlet set end det gamle monolit-job).
- [x] **Web-Scraping (Chromium):** Agenten kan hente indhold fra komplekse sider (f.eks. GomSpace) udenom cookie-mure via `--dump-dom`.
- [x] **Data Separation:** Brødtekst gemmes som rene `.md` filer. Metadata (navn, adresse, sprog, layout-præferencer) gemmes i `job_data.json`.
- [x] **Lokal Tidszone (TS):** Filnavne og log-tidsstempler respekterer lokal dansk tid (CEST/CET) via `timeUtils.js`.

## 🛡️ Kode & Arkitektur Regler (Må aldrig brydes)
- [x] **Brug ALTID timeUtils.js:** For at undgå forkerte UTC-tidsstempler (TS), skal `new Date().toISOString()` ALDRIG bruges direkte. Brug i stedet `getLocalISOTime()` eller `getFileSafeTimestamp()` fra `utils/timeUtils.js`.
- [x] **Rene Markdown Filer:** `.md` filer i output-mapperne må KUN indeholde brødtekst. System-tags (`---LAYOUT_METADATA---` osv.) tilhører fortiden og må ikke genindføres.
- [x] **Bevar Mellemrum:** Regex-regler i backend (`wrap.js`) må aldrig trimme eller spise bevidste linjeskift eller mellemrum (som f.eks. før en signatur).

## 🟢 UI & Redigering
- [x] **Manuel Redigering (Ren Markdown):** Tekst i editoren indeholder *ikke* skjulte system-tags (som `---LAYOUT_METADATA---`).
- [x] **Mellemrum og Linjeskift Bevares:** Bevidste formateringer (f.eks. et mellemrum før "bob" i bunden af et dokument) respekteres og overføres korrekt til PDF'en, da regex tag-stripping er fjernet fra `wrap.js`.
- [x] **Gem Rettelser (HTML/PDF):** Tryk på "Gem ændringer" genererer en fejl-fri PDF, hvor brødteksten flettes perfekt sammen med layout-skabelonen.
- [x] **Visuel Feedback:** Alle knapper der starter en længerevarende proces (f.eks. "Start Automatisering" og "AI Forfin") viser en "snurretop" (Drebin Spinner), så brugeren ved, at systemet arbejder.

## 🟢 AI-Forfinelse (Refine)
- [x] **Dokument-Specifik Hinting:** Der findes en individuel hint-boks til hvert dokument (Ansøgning, CV, Match, ICAN+).
- [x] **Partiel Refine (Enkelt-dokument):** Når der trykkes på "AI Forfin" for ét dokument, bevarer AI'en sproget, overholder de generelle `ai_instructions.md` og ødelægger ikke dokumentets layout eller metadata.
- [x] **Metadata-Sikring under Refine:** AI'ens svar "støvsuges" for utilsigtede tags, før brødteksten gemmes, hvilket forhindrer "spøgelses-tags" i PDF'en.
- [x] **AI Præferencer:** Systemet husker automatisk den valgte AI-model pr. provider og gemmer dem i `data/ai_preferences.json`.

## 🟡 Job-Radar & Automation
- [x] **Arkivér Knap:** Job-radaren har en "Arkivér"-knap i UI'et.
- [x] **Auto-Skjul:** Jobs markeret som 'applied' (Søgt) skjules automatisk fra radarens hovedvisning.
- [x] **Direkte Automatisering:** Start af et job direkte fra radaren sætter automatisk jobbet til 'applied'.
- [ ] **Job-Radar Cron:** Radaren kører stabilt i baggrunden hver 6. time uden at crashe systemet.

---
**Status-ikoner:**
- [x] Pass
- [ ] Fail / Mangler test
- [~] Under observation