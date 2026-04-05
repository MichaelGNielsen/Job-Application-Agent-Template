<!--
  Job Application Agent Template
  Designer: MGN (mgn@mgnielsen.dk)
  Copyright (c) 2026 MGN. All rights reserved.
-->

# Job Application Agent - Template (Tintin Edition)

Dette projekt er den officielle **Template** udgave af Job Application Agent, illustreret med den ikoniske reporter **Tintin** som case-studie.


## 🚀 Hurtig opstart
Hvis det er første gang du bruger agenten, så følg vores **[Brugervejledning (How-to)](docs/usage_guide.md)** for at få overblik over alle funktioner.

> **⚠️ VIGTIGT (Multi-instans):** Da både `Job-Application-Agent-MGN` og `Job-Application-Agent-Template` nu benytter de samme containernavne (for nemmere synkronisering), kan de ikke køre samtidigt. Husk altid at køre `docker compose down` i den aktive mappe, før du starter den anden.

# Job Application Agent MGN (v5.6.0)

> **Bemærk:** Hele dette projekt – herunder kode, arkitektur, dokumentation og PUML-figurer – er genereret 100% af AI (Gemini CLI) udelukkende baseret på prompts.

Dette er den officielle version af Job Application Agent Template, optimeret til rigtige ansøgere. Systemet automatiserer processen med at skræddersy ansøgninger og CV'er ved hjælp af AI.

### Sproghåndtering

Systemet er designet til at håndtere internationale jobopslag automatisk:
- **Ansøgning & CV:** Genereres på samme sprog som jobopslaget (Dansk, Engelsk, Tysk, Fransk, Spansk).
- **Match Analyse & ICAN+ Pitch:** Genereres altid på **dansk**.

## 🚀 Kom i gang

1. **Konfiguration:** Kopier `.env_template` til `.env`.
   * *Ollama (Lokal AI):* Kører automatisk (standard).
   * *Gemini (Cloud AI):* Indsæt din Gemini API-nøgle i `.env`.
2. **Master CV:** Opdater `data/brutto_cv.md` med din erhvervserfaring. Systemet udleder automatisk dit navn og dine initialer herfra.
3. **Google Gemini OAuth (Vigtigt for EU-brugere):** 
   For at undgå stramme API Rate Limits (GDPR), bruger systemet dine personlige browser-credentials.
   * Åbn din terminal (host-maskinen) og kør: `npm install -g @google/gemini-cli && gemini login`
   * Docker låner automatisk din `~/.gemini` mappe ved opstart.
4. **Start systemet:**
   ```bash
   docker compose up -d --build
   ```
5. **Adgang:** Åbn `http://localhost:3000` i din browser.

## 📄 Dokumenter & Features

Systemet genererer 4 centrale dokumenter:
1. **Ansøgning (PDF):** Målrettet og professionelt.
2. **CV (PDF):** Skræddersyet til jobbet.
3. **Match Analyse (PDF):** AI-vurdering af din profil.
4. **ICAN+ Pitch (PDF):** Guide til jobsamtalen.

### Særlige funktioner

* **🎯 Job-Radar:** Proaktiv søgeagent der automatisk finder og scorer relevante job fra Jobindex og Jobnet baseret på dit CV.
* **📦 Arkivering:** Gemmer automatisk det originale jobopslag som PDF sammen med dine genererede dokumenter.
* **🎨 Live Design:** Øjeblikkelig opdatering af previews når du retter i dit layout.

## 🛠️ Teknologier

* **Backend:** Node.js (Express), BullMQ, Redis.
* **Frontend:** React (Vite, TypeScript, Tailwind CSS).
* **AI:** Google Gemini via Gemini CLI.
* **Layout:** HTML/CSS konverteret til PDF via Chromium Headless.

---

*Sidst opdateret: 4. april 2026 (v5.6.0)*

## 🛠️ Udvikling & API
Systemet er født med indbygget API-dokumentation via Swagger. Dette gør det let at teste alle funktioner manuelt.

- **API Dokumentation (Swagger UI):** [http://localhost:3002/api-docs](http://localhost:3002/api-docs)

## 📚 Dokumentation

For mere dybdegående information, se venligst følgende dokumenter:
- [Brugervejledning (How-to)](docs/usage_guide.md) - Komplet guide til alle agentens funktioner.
- [API Dokumentation](docs/api.md) - Teknisk guide til endpoints og Swagger.
- [Intern Kodedokumentation](docs/code_documentation.md) - Hvordan man genererer teknisk reference via JSDoc.
- [Job-Radar (Proaktiv Søgning)](docs/job_radar.md) - Hvordan radaren finder job til dig.
- [Testvejledning](docs/test.md) - Hvordan du installerer og kører tests.
- [Systemarkitektur](docs/architecture.md) - Overblik over systemets opbygning.
- [TODO Liste](TODO.md) - Planlagte forbedringer og roadmap.
- [Journal & Roadmap](docs/journal.md) - Projektets historik.
- [GEMINI.md](GEMINI.md) - Instruktioner til AI-udviklere (Gemini CLI).
- [Coding Standards & Arkitektur](docs/coding_standards.md) - Tekniske og arkitektoniske retningslinjer.
