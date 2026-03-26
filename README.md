<!--
  Job Application Agent
  Designer: MGN (mgn@mgnielsen.dk)
  Copyright (c) 2026 MGN. All rights reserved.
  BEMÆRK: Denne kode anvender AI til generering og behandling.
  Brugeren skal selv verificere, at resultatet er som forventet.
  Softwaren leveres "som den er", uden nogen form for garanti.
  Brug af softwaren sker på eget ansvar.
-->

# Job Application Agent (v4.3.0)

> **📣 Vi vil gerne høre fra dig!**
> Har du brugt Agenten til din jobsøgning? Vi vil elske at høre om din oplevelse.
> Udfyld venligst [spørgeskema.md](./spørgeskema.md) og send det til: **jaa@mgnielsen.dk**.
> Din feedback hjælper os med at gøre værktøjet endnu skarpere!

Dette projekt automatiserer processen med at skræddersy ansøgninger og CV'er ved hjælp af AI (Google Gemini).

## 🚀 Hurtig opstart
Hvis det er første gang du bruger agenten, så følg vores **[Brugervejledning (How-to)](docs/usage_guide.md)** for at få overblik over alle funktioner.

> **⚠️ VIGTIGT (Multi-instans):** Da systemet er baseret på standardiserede containernavne, kan du ikke køre flere instanser af Agenten samtidigt. Husk altid at køre `docker compose down` i den aktive mappe, før du starter en ny version.

### Sproghåndtering

Systemet er designet til at håndtere internationale jobopslag automatisk:
- **Ansøgning & CV:** Genereres altid på det samme sprog som selve jobopslaget (understøtter Dansk, Engelsk, Tysk, Fransk og Spansk). Dette inkluderer automatisk oversættelse af jobtitler og erfaring fra Brutto-CV'et.
- **Match Analyse & ICAN+ Pitch:** Disse dokumenter genereres altid på **dansk**, da de primært er tiltænkt ansøgerens egen forberedelse og overblik.

## 🚀 Kom i gang

1. **Konfiguration:** Kopier `.env_ai_template` til `.env_ai` i rodmappen og indsæt din Gemini API-nøgle.
2. **Eksempel:** Se mappen `output/2026-03-21-15-27-08_senior_efterforsker_interpol/` for at se hvordan et færdigt resultat ser ud.
3. **Master CV:** Opdater `data/brutto_cv.md` med din personlige erhvervserfaring og kontaktdata.
   - **Vigtigt:** Brug de præcise labels `Navn:`, `Adresse:`, `Mobil:` og `E-mail:` for at sikre, at dine PDF-headere bliver udfyldt korrekt.
4. **Start systemet:**
   ```bash
   docker compose up -d --build
   ```
5. **Adgang:** Åbn `http://localhost:3000` i din browser.
6. **Generering:** Indsæt teksten fra et jobopslag og tryk på **🚀 Start Automatisering**.
7. **Resultat:** Efter ca. 30-60 sekunder vises dine dokumenter i browseren.

## 📄 Dokumenter & Features

Systemet genererer 4 centrale dokumenter for hvert jobopslag:

1. **Ansøgning (PDF):** Målrettet og professionelt opsat.
2. **CV (PDF):** Skræddersyet til jobbet med fokus på relevante kompetencer.
3. **Match Analyse (PDF):** En objektiv vurdering af, hvor godt din profil matcher jobbet.
4. **ICAN+ Pitch (PDF):** En strategisk guide til jobsamtalen (på dansk).

### Særlige funktioner

* **Autonom Research:** Systemet forsøger selv at finde virksomhedens hjemmeside og adresse via AI, hvis du ikke har angivet en URL. Dette sikrer et professionelt brevhoved.
* **Personlige Hints:** Brug hint-feltet i browseren til at give AI'en specifikke instrukser (f.eks. "Læg vægt på min ledelseserfaring" eller "Skriv på tysk, selvom opslaget er engelsk").
* **Live Design:** Når du retter i dit design-layout (HTML/CSS), opdateres alle dine åbne dokument-previews øjeblikkeligt.

## 🛠️ Teknologier

* **Backend:** Node.js (Express), BullMQ, Redis.
* **Frontend:** React (Vite, TypeScript, Tailwind CSS).
* **AI:** Google Gemini via Gemini CLI.
* **Layout:** HTML/CSS konverteret til PDF via Chromium Headless.

## 📝 Markdown Formatering

Følg altid disse regler for Markdown-filer for at sikre optimal kompatibilitet med VS Code (især "Markdown All in One" extensionen):

- Brug `-` til lister.
- Altid en tom linje efter overskrifter.
- Maksimalt én tom linje i træk.
- Kun én H1 pr. fil.

---

*Sidst opdateret: 26. marts 2026 (v4.3.1)*

## 📚 Dokumentation

For mere dybdegående information, se venligst følgende dokumenter:
- [Brugervejledning (How-to)](docs/usage_guide.md) - Komplet guide til alle agentens funktioner.
- [Testvejledning](docs/test.md) - Hvordan du installerer og kører tests.
- [Systemarkitektur](docs/architecture.md) - Overblik over systemets opbygning.
- [TODO Liste](TODO.md) - Planlagte forbedringer og roadmap.
- [Docker Opsætning](docs/docker_setup.md) - Detaljeret guide til installation.
- [Logger Anvendelse](docs/logger_usage.md) - Detaljeret guide til lognings-systemet.
- [Data Flow](docs/data_flow.md) - Hvordan data flyder gennem systemet.
- [Gemini CLI & API Test](docs/gemini_usage.md) - Hvordan du tester og bruger AI-motoren.
- [Journal & Roadmap](docs/journal.md) - Projektets historik og fremtidige planer.
- [GEMINI.md](GEMINI.md) - Instruktioner til AI-udviklere (Gemini CLI).
