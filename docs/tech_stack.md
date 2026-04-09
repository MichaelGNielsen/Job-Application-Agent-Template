<!--
  Job Application Agent - Template Edition
  Softwaren leveres "som den er", uden nogen form for garanti.
  Brug af softwaren sker på eget ansvar.
-->

# Teknisk Overblik & Stack (v6.1.2)

Dette dokument giver et hurtigt og letforståeligt overblik over teknologierne bag Job Application Agent (JAA) og hvordan systemet er struktureret.

## 🛠️ Teknisk Stack

Systemet er bygget på en moderne JavaScript/TypeScript-stack. Bemærk: Der findes **ingen Python-kode** i projektet; alt er drevet af Node.js og React.

- **Backend:** Node.js (Express) som fungerer som systemets hjerne og håndterer REST API'et.
- **Job-kø:** [BullMQ](https://docs.bullmq.io/) med **Redis** til at styre asynkrone opgaver (AI-prompts, dokument-generering). Dette sikrer, at systemet forbliver stabilt, selv når AI'en er langsom til at svare.
- **Frontend:** React (Vite + TypeScript) stylet med **Tailwind CSS**. Det giver en lynhurtig og moderne web-brugerflade.
- **AI-Integration:** Systemet bruger primært **Gemini CLI** til tekstbehandling, men understøtter også lokale modeller via **OpenCode** og **Ollama**.
- **Dokument-generering:** **Chromium Headless** bruges til at forvandle HTML/CSS-templates til færdige PDF-filer med professionelt layout.
- **Markdown-konvertering:** **Pandoc** bruges til at transformere AI'ens Markdown-output til HTML.

## 📂 Systemets Struktur (Hvad er der i mapperne?)

- **`backend/`:** Indeholder API-controllere, services (forretningslogik) og worker-scripts, der håndterer job-køen.
- **`frontend/`:** React-applikationen, hvor du uploader jobopslag, ser live-previews og overvåger status.
- **`data/`:** Her ligger dit **Master CV** (`brutto_cv.md`), som er kilden til alt, AI'en ved om dig. Det er her, dine data "bor".
- **`templates/`:** De vigtige instruktioner til AI'en (`ai_instructions.md`) og de visuelle layouts (HTML/Markdown) for dine CV'er og ansøgninger.
- **`output/`:** Her lander alle de færdige mapper med ansøgning, CV, Match-analyse og ICAN+ pitch for hvert job, du søger.

## 🚀 Hvordan kører det?

Alt er containeriseret med **Docker**, hvilket betyder:
1. Du behøver ikke installere Node.js, Redis eller Pandoc lokalt.
2. Hele systemet (backend, frontend og Redis) startes med én kommando: `docker-compose up`.
3. Miljøet er isoleret, så det kører ens på alle maskiner.

---
*Sidst opdateret: 9. april 2026 (v6.1.2)*
