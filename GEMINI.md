# GEMINI.md - Job Application Agent Template

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

## 📝 Kodestandarder & Principper
1. **Markdown:** Brug altid `-` til lister (aldrig `*` eller `+`). Altid en tom linje efter overskrifter.
2. **AI Tone of Voice:** Overhold "Jysk ærlighed" princippet: Direkte, nøgternt og uden floskler (ingen "krydsfelt" eller "passioneret").
3. **Sikkerhed:** `.env_ai` må ALDRIG commit'es eller logges.
4. **Validering:** Efter ændringer i templates eller logik, skal der altid køres en "Trial Run" (prøvekørsel) for at verificere outputtet.

## 🚀 Workflows

### 1. Vedligeholdelse af Master CV
Når brugeren har ny erfaring, skal `data/brutto_cv.md` opdateres kirurgisk. Sørg for at stamdata (Navn, Adresse, etc.) følger formatet, så header-ekstraktionen virker.

### 2. Udvikling af AI Instruktioner
Ved ændringer i `templates/ai_instructions.md`, skal du sikre dig at alle mærkater (`---ANSØGNING---` etc.) bevares præcis som de er, da backenden afhænger af dem.

### 3. Debugging
- Tjek `docker-compose logs -f backend` for fejl i genereringen.
- Tjek `redis` status hvis jobs ikke starter.
- Verificer at `GEMINI_API_KEY` is korrekt i `.env_ai`.

## 🛠️ Nyttige Kommandoer
- `docker-compose up -d --build`: Genstart hele systemet efter kodeændringer.
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
*Sidst opdateret: 21. marts 2026*
