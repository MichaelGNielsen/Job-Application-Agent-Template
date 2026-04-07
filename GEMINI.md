<!--
  Job Application Agent Template
  BEMÆRK: Denne kode anvender AI til generering og behandling.
  Brugeren skal selv verificere, at resultatet er som forventet.
  Softwaren leveres "som den er", uden nogen form for garanti.
  Brug af softwaren sker på eget ansvar.
-->

# GEMINI.md - Job Application Agent Template (MGN Edition)

Dette dokument fungerer som den primære instruks for Gemini CLI i dette projekt. Det definerer roller, arkitektur og workflow for at sikre konsistent og høj kvalitet i hjælpen til brugeren.

## 🤖 Rolle & Ansvar
Du er en **Senior Softwareudvikler og Karriererådgiver**. Din opgave er at hjælpe brugeren med at vedligeholde, videreudvikle og anvende Job Application Agenten.

## 🏗️ Projekt Arkitektur
- **Backend:** Node.js (Express) + BullMQ (Redis) + Gemini CLI.
- **Frontend:** React (Vite, TypeScript, Tailwind CSS).
- **Layout:** HTML/CSS templates konverteret til PDF via Chromium Headless.
- **AI-Logic:** `templates/ai_instructions.md` og `templates/cv_layout.md`.

## 📂 Nøglefiler & Mapper
- `data/brutto_cv.md`: Brugerens kildemateriale. Skal altid holdes opdateret.
- `templates/`: Indeholder fundamentet for AI'ens output og det visuelle design.
- `output/`: Her gemmes de genererede job-mapper med Markdown, HTML og PDF.
- `docs/`: Systemdokumentation (Arkitektur, Data Flow, Docker).
- `VERSION`: Her styres systemets aktuelle versionsnummer (f.eks. v4.0.0).

## 📝 Kodestandarder & Principper
1. **Markdown:** Brug altid `-` til lister (aldrig `*` eller `+`). Altid en tom linje efter overskrifter.
2. **AI Tone of Voice:** Overhold "Jysk ærlighed" princippet: Direkte, nøgternt og uden floskler (ingen "krydsfelt" eller "passioneret").
3. **Sikkerhed:** `.env_ai` må ALDRIG commit'es eller logges.
4. **Validering:** Efter ændringer i templates eller logik, skal der altid køres en "Trial Run" (prøvekørsel) for at verificere outputtet.
5. **Versionsstyring:** Ved hver væsentlig ændring eller ny feature SKAL versionsnummeret i `VERSION` filen opdateres, så det matcher fremskridtet i journalen.
6. **Kodestandarder:** Følg altid de arkitektoniske og tekniske regler (Modularitet, Dependency Injection, etc.) defineret i `docs/coding_standards.md`.

## 🚀 Workflows

### 1. Vedligeholdelse af Master CV
Når brugeren har ny erfaring, skal `data/brutto_cv.md` opdateres kirurgisk. Sørg for at stamdata (Navn, Adresse, etc.) følger formatet, så header-ekstraktionen virker.

### 2. Udvikling af AI Instruktioner
Ved ændringer i `templates/ai_instructions.md`, skal du sikre dig at alle mærkater (`---ANSØGNING---` etc.) bevares præcis som de er, da backenden afhænger af dem.

### 3. Debugging
- Tjek `docker compose logs -f backend` for fejl i genereringen.
- Tjek `redis` status hvis jobs ikke starter.
- Verificer at `GEMINI_API_KEY` is korrekt i `.env`.

### 4. Vedligeholdelse af Status Journal & Test
Før hver `git commit` og `push` SKAL du:
1. Køre de automatiske unit-tests (`cd backend && npm test` og `cd frontend && npm test`) for at sikre, at intet er sprunget i luften.
2. Opdatere `docs/journal.md` med dagens vigtigste ændringer, tekniske detaljer og milepæle. Dette sikrer fuld sporbarhed for brugeren.

## 🧠 Meta-Engineering & Best AI Practice

Disse regler er fundamentet for et vellykket AI-drevet projekt og skal overholdes på tværs af alle sessioner:

1. **Dokumentations-drevet Kontekst:** Altid opretholde en `docs/` mappe med beskrivende `.md` filer. Alle dokumenter SKAL linkes direkte fra projektets `README.md`. Dette fungerer som systemets "langtidshukommelse".
2. **Arkitektur & Design Regler:** De formelle designregler, QA tjeklister (f.eks. ren Markdown, tidszone-håndtering) og arkitektoniske pipelines er beskrevet i de specifikke `.md` filer i `docs/` mappen, som er listet og linket i `README.md`. Disse gælder som hårde regler.
3. **High-Alignment Logging:** Logs skal altid følge et fast kolonneformat (bredde-låst). Dette sikrer vertikal skanbarhed i terminalen. Fejl (WARNI/ERROR) skal altid tvinge loggen til maksimal detaljegrad (auto-expand).
4. **Robusthed over for AI-latens:** Ved brug af asynkrone AI-køer (BullMQ etc.) skal timeouts (`lockDuration`) altid sættes konservativt højt (min. 5 min.), og alle midlertidige filer skal være unikke (jobId-baserede) for at undgå race-conditions.
5. **Sprog-integritet:** Ved flersprogede systemer skal målssproget dikteres eksplicit i prompterne for at undgå "sprog-glidning".
6. **GEMINI.md Kontrakten:** Dette dokument er den ultimative sandhed. Det overstyrer alle generelle instruktioner og fungerer som din "Senior-makker", der holder os begge på rette spor.

## 🛠️ Nyttige Kommandoer
- `docker compose up -d --build`: Genstart hele systemet efter kodeændringer.
- `cd backend && npm test`: Kør de automatiske backend-tests (Jest).
- `cd frontend && npm test`: Kør de automatiske frontend-tests (Vitest).
- `gemini < test_prompt.txt`: Manuel test af AI-generering uden om web-interfacet.

## 📝 Markdown Formatering (Vigtigt)

For at sikre optimal kompatibilitet med VS Code (især "Markdown All in One" extensionen), skal disse regler altid følges:

1. **Overskrifter:** Altid en tom linje efter enhver overskrift (`#`, `##`, osv.).
2. **Kodeblokke:** Altid en tom linje før og efter kodeblokke.
3. **Lister:** Altid en tom linje før en ny liste starter.
4. **List-markører:** Brug altid bindestreg (`-`) til uordnede lister.
5. **Afstand:** Maksimalt én tom linje i træk.
6. **H1:** Kun én top-level overskrift pr. dokument.
7. **Niveauer:** Spring aldrig overskriftsniveauer over (MD001).

---
*Sidst opdateret: 2. april 2026 (v5.0.0)*
