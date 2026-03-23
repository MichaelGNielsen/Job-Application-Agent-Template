<!--
  Job Application Agent Template
  Designer: MGN (mgn@mgnielsen.dk)
  Copyright (c) 2026 MGN. All rights reserved.
  BEMÆRK: Denne kode anvender AI til generering og behandling.
  Brugeren skal selv verificere, at resultatet er som forventet.
  Softwaren leveres "som den er", uden nogen form for garanti.
  Brug af softwaren sker på eget ansvar.
-->

# Status Journal - 10. Marts 2026

## Milepæl: Automations-fundamentet er lagt 🚀

Vi har i dag transformeret projektet fra et manuelt script-baseret workflow til en fuld-stack applikation kørende i Docker.

### Hvad virker 100%

1. **Infrastruktur**
  * Redis, Backend (Node.js/BullMQ) og Frontend (React/Vite) kører synkroniseret i Docker.
2. **Kø-system**
  * BullMQ håndterer job-generering stabilt i baggrunden.
3. **Real-tid**
  * Socket.io sender statusopdateringer fra Workeren -> Serveren -> Browseren live.
4. **Gemini CLI**
  * Kører fejlfrit inde i containeren med adgang til hostens `.gemini` konfiguration.
5. **Fil-struktur**
  * Mapper oprettes automatisk med `YYYYMMDD_HHMM_firma_stilling` navngivning.
6. **Git Sikkerhed**
  * `.env` er udelukket fra git, og genererede mapper er ignoreret.

### Kendte udfordringer (Næste skridt)

1. **Content Preamble**
  * Gemini sniger stadig en indledning med ("Jeg vil nu undersøge..."), hvilket forskyder dokumenterne i UI-søjlerne.
2. **404 på Links**
  * Der er stadig en mismatch mellem Docker-stierne og Express-routeren for `/api/applications`.
  * Fejl: `Cannot GET /api/applications/20260310_1454_mgn_interpol_senior_efterforsker/ican.html`
3. **PDF Generering**
  * Næste store feature er automatisk konvertering fra HTML til PDF via Puppeteer/Chromium i backenden.

### Version `v1.1.0-automation-foundation`

Dette punkt markerer overgangen til en ægte applikation.

## Status: 11. Marts 2026 - Preamble & Print Fix 🛠️💎

Vi har i dag løst de sidste kritiske UI-problemer og gjort dokumenterne klar til fysisk print.

### Nye forbedringer

1. **Preamble Extraction**
  * Gemini's "meta-talk" bliver nu automatisk skilt fra selve dokumenterne. Ingen flere forskubbede UI-søjler!
2. **Print-Ready HTML**
  * Genererede HTML-filer har nu hvid baggrund, pænere typografi og skjuler automatisk "Print"-knappen ved PDF-generering.
3. **Docker Resilience**
  * En ny guide (`docs/docker_usage.md`) beskriver hvordan systemet vækkes korrekt efter PC-reset.
4. **Bind-Mount Robusthed**
  * Verificeret synkronisering mellem Docker-container og E-drev.

### Næste store skridt (Milepæl 1.3)

1. **Ægte PDF**
  * Implementering af Puppeteer i backenden for automatisk konvertering uden browser-popup.

### Version `v1.2.0-print-ready`

Dette punkt markerer at systemet est stabilt og producerer brugbare slutdokumenter. 🚀✨

Fyraften! 🍻✨

## Status: 11. Marts 2026 - Den Store Interaktive Opdatering 🛠️💎

En dag med enorme fremskridt! Vi er gået fra en statisk generator til et interaktivt værktøj med live-redigering.

### Dagens bedrifter (2.7.0)

1. **Docker Power**
  * `pandoc` og `chromium` kører nu fejlfrit i containeren.
2. **Blue-Shift Interface**
  * Frontenden har fået et topmoderne teknisk look (Blue/Cyan).
3. **Hint-Engine**
  * Du kan nu styre AI'en via en "Hint Box" (f.eks. "Husk min AI erfaring").
4. **Refine Loop**
  * Det er nu muligt at rette Markdown direkte i browseren og se ændringerne live i HTML/PDF layoutet.
5. **Pixel-Perfect Layout**
  * Master-header og signatur er nu automatiseret og afstanden er fintunet.
6. **Struktureret CV/ICAN+**
  * Automatiske `###` overskrifter sikrer professionel luft i alle dokumenter.

### Plan for i morgen (12. Marts)

1. **Match Analyse**
  * Tilføj `match.md` til pakken (score og gap-analyse mellem job og profil).
2. **Standardiseret Navngivning**
  * Sikre ensartet filnavns-format for alle PDF'er.
3. **Filnavn i Preview**
  * Vis det kommende filnavn i frontenden, så man ved hvad man printer.
4. **Bulk Export**
  * En "Gem Alle" knap til at eksportere den fulde pakke af dokumenter.

## TODO - Job Application Agent Template

### 🐛 Kritiske Fixes (Høj Prioritet)

1. **"Index of /" fejl ved opdatering**
   * **Problem:** Ved manuelle rettelser eller auto-save kan ansøgningen nogle gange vise en fil-liste (Index of /) fra Docker-containeren i stedet for selve indholdet.
   * **Hypotese:** Sker sandsynligvis i `preview` loopback eller ved forkert sti-håndtering i `server.js`.

### 1. Layout & Styling (Fine-tuning)

1. **Signatur-afstand**
  * Gør afstanden mellem "Med venlig hilsen" og "Michael G. Nielsen" mindre.
2. **Konsistens**
  * HTML-preview i FE og PDF är nu identiske via iframe.
3. **Filnavn i UI**
  * Vis det genererede filnavn og sprog i UI'et.
4. **AI Self-Correction**
  * Tilføj et ekstra step i `worker.js`, hvor AI'en korrekturlæser sit eget output.
5. **Match Analyse**
  * Implementer `match.md` generering.

### 6. Bulk Actions & Export

1. **Gem Alle Knap**
  * Implementer bulk-print/save.
2. **Overflow Check**
  * Implementer teknisk tjek for overflow (A4 limit).

## Status: 14. Marts 2026 - Demo-klar v2.6.2 🚀🏆

Vi har i dag gennemført den store oprydning og tekniske fintuning før AKA-præsentationen.

### Dagens vigtigste resultater

1. **Template Engine**
  * Layout (HTML/CSS) og AI-instrukser (Prompts) er nu helt adskilt fra koden i `/templates`.
2. **Pandoc GFM Integration**
  * Vi bruger nu professionel Markdown-konvertering, hvilket sikrer perfekte bullets og formatering.
3. **Automatiseret PDF**
  * Systemet genererer nu automatisk 4 separate PDF-filer pr. kørsel med korrekt navngivning.
4. **Robust Sektions-opdeling**
  * AI'ens svar bliver nu præcist opdelt, så CV'et kun indeholder CV'et.
5. **Visuel Identitet**
  * Kandidat-højdepunkter (billeder) er nu integreret i CV-layoutet.
6. **Clean Install**
  * Alle overflødige filer og test-mapper er fjernet. Projektet er 100% præsentationsklart.

### Klar til demo

Systemet er testet med både dansk og engelsk (UK) jobopslag og håndterer nu sprog, hilsener og typografi fejlfrit.

God demo i morgen! 🎩🚀🏁

### ⚠️ Observation Forskel på UE1 og RPi5 (2.7.0)

Under 'crash test' på Raspberry Pi 5 blev følgende observeret:

1. **Auto-Save**
  * På RPi5 genereres alle 4 PDF-filer nu automatisk i baggrunden (v2.6.11 feature). På UE1 (hvis ikke opdateret) kræver det manuel handling.
2. **UI Interaktion**
  * Der er rapporteret problemer med at starte en 'ny' generering fra web-interfacet på RPi5 efter den første kørsel. Det skal undersøges om det skyldes Redis-køen eller Socket.io forbindelsen på ARM64.
3. **Filstruktur**
  * RPi5 setup'et er nu fuldt funktionelt med 'docker compose' og absolutte 'file://' stier til PDF-generering.

### 🖼️ Note Billed-sti & Browser-print (2.7.0)

1. **Problem**
  * Billeder i CV vises i PDF'er genereret af backenden, men mangler ved manuelt print fra browseren.
2. **Årsag**
  * Relativ sti (../../pictures/) virker for Chromium på disk, men ikke for browseren via URL.
3. **Handling i morgen**
  * Backend skal 'serve' /pictures mappen statisk via Express, og stierne i utils.js skal opdateres til at matche.

### 📄 Note Download Filnavn

1. **Handling i morgen**
  * Sikre 'Content-Disposition' header i API'et, så PDF'er downloades med deres rigtige navne i stedet for standardnavne.

## Status: 17. Marts 2026 - Det Internationale Gennembrud (v2.8.1) 🌍🚀

En formiddag med ekstrem høj kadence og fokus på internationalisering og layout-præcision.

### Gennemførte forbedringer

1. **Dynamiske Mappenavne**
   * AI'en foreslår nu selv sigende mappenavne på brevets sprog (f.eks. 'senior_investigator_interpol').
   * Backenden omdøber automatisk output-mapperne med tidsstempel.
2. **Layout & CSS (v2.7.9)**
   * Fikset "ciffer-spredning" i telefonnumre ved at tvinge venstrestilling i headeren.
   * Brødtekst er nu professionelt "justified", mens metadata er venstrestillet.
3. **Robust i18n Parsing (v2.8.0)**
   * Implementeret kirurgisk regex-udtrækning af metadata (Location, Sign-off, Folder-Name).
   * Tvungne linjeskift ved modtager-blokken (Att.: linjen).

### Kendte udfordringer (Næste skridt)

1. **"Høfligheds-fejlen"**
   * AI'en sniger stadig franske gloser (À l'attention de) ind i danske/engelske breve, når modtageren bor i Frankrig.
   * Løsning: Implementer et "Sprogligt Integritets-regelsæt" i ai_instructions.md.

## Status: 20. Marts 2026 - Den Autonome & Skarpe Agent (v3.1.1) 🧠🤖

En dag præget af et kvantespring i agentens intelligens og autonomi. Vi er gået fra et værktøj, der kræver input, til en agent, der selv laver sit hjemmearbejde.

### Dagens vigtigste resultater (v3.1.1)

1. **Autonom Research & Scraping**
   * Agenten kan nu selv finde virksomhedens adresse og URL baseret på navnet i jobopslaget.
   * Automatisk scraping af firma-hjemmesider (via `axios`/`cheerio`) trækker baggrundsviden ud, som AI'en bruger til at vinkle ansøgningen.
   * Specifik lokations-detektion (f.eks. "NOVI i Aalborg") sikrer, at den korrekte afdelingsadresse findes.

2. **Sprog & Tone-forskrifter**
   * **Tvungen Jeg-form:** Alle dokumenter (inkl. CV, Match og ICAN+) skrives nu konsekvent i førsteperson.
   * **Jysk Ærlighed 2.0:** AI-superlativer som "fantastisk", "perfekt" og "expert" er nu bandlyst for at sikre en jordbundet og troværdig stil.
   * **Forbedret sprogdetektering:** Systemet ignorerer nu kontaktinfo i toppen af opslag for at undgå sprogforvirring (Dansk vs. Engelsk).

3. **Session & Historik**
   * **session.md:** Alle inputs (URL, hints, jobtekst) og AI'ens ræsonnement gemmes nu i én samlet fil i hver job-mappe.
   * **Persistent historik:** `session.md` opdateres og bevares selv ved gentagne "Refine" kørsler.

4. **UI & UX Forbedringer**
   * **Auto-Save:** Ændringer i Markdown gemmes nu automatisk, når man skifter til Preview (HTML/PDF).
   * **AI Logbog:** Den blå boks ("AI Ræsonnement") er nu fuldt funktionel og viser AI'ens faktiske strategiske overvejelser.
   * **Hint-Editor:** Udbygget tekstfelt til personlige hints med scroll-bar og bedre plads.
   * **Signatur-kontrol:** Signaturen ("Med venlig hilsen...") er flyttet fra backend-kode til Markdown, så den kan redigeres direkte af brugeren.

5. **Infrastruktur & Miljø**
   * **Tidszone:** Systemet kører nu synkroniseret med dansk tid (`Europe/Copenhagen`).
   * **Git integration:** Data og resultater tracks nu i det private repository (undtagen den dynamiske `/new` mappe).

### Næste skridt (I morgen)

1. **Template-Synkronisering**
   * Overførsel af de generiske forbedringer til `Job-Application-Agent-Template` repoet.
2. **Auto-test**
   * Implementering af backend API tests via curl scripts.

## Status: 23. Marts 2026 - Test-stabilitet & SmartLogger v4.0 🛠️✅

Dagen har stået på teknisk gældsafvikling og sikring af test-stabilitet på tværs af platforme.

### Dagens vigtigste resultater

1. **Test-stabilitet (Frontend)**
   * Fikset en kritisk fejl i `App.test.tsx`, hvor "Design" fanebladet kolliderede med footer-teksten.
   * Skiftet fra `getByText` til `getByRole('button', { name: ... })` for at sikre entydige matches.
2. **SmartLogger v4.0 (Backend)**
   * Implementeret unit tests til `logger`-modulet i `utils.test.js`.
   * Verificeret at `VERBOSE` miljøvariablen (fra `-v` til `-vvvvv`) bliver respekteret korrekt.
   * Tilføjet tracing af dokument-generering (`wrap`-funktionen) for bedre debugging.
3. **npm test workflow**
   * Opdateret `package.json` i backenden til altid at køre med `--verbose`, så log-output er synligt under udvikling.
   * Verificeret at alle 8 unit tests (5 backend, 3 frontend) nu består 100%.
4. **Dependency Management**
   * Identificeret og løst problemer med manglende `node_modules` i et friskt setup.

### Læring & Best Practice

* **Surgical Selectors:** Brug altid `getByRole` fremfor `getByText` i tests for at undgå utilsigtede matches med statisk tekst (footer, copyright, etc.).
* **Logging i tests:** Ved at mocke `process.env` i Jest kan vi nu teste log-logikken uden at ændre på selve `.env_ai` filen.

Fyraften og god stil! 🎩🚀🏁

Fyraften og god weekend! 🎩🍺🚀
