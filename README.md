<!--
  Job Application Agent Template
  Designer: MGN (mgn@mgnielsen.dk)
  Copyright (c) 2026 MGN. All rights reserved.
-->

# Job Application Agent MGN (v6.0.0)

Dette projekt automatiserer processen med at skræddersy ansøgninger og CV'er ved hjælp af AI. Systemet er designet til at skabe en stærk "rød tråd" gennem dit ansøgningsmateriale via en avanceret strategisk pipeline.

## 🚀 Hurtig opstart
Hvis det er første gang du bruger agenten, så følg vores **[Setup Guide](docs/setup.md)** og **[Brugervejledning](docs/usage_guide.md)**.

> **⚠️ VIGTIGT (Multi-instans):** Da både `MGN` og `Template` versionerne benytter de samme containernavne, kan de ikke køre samtidigt. Husk altid at køre `docker compose down` før du skifter projekt.

## 🛠️ Kerne-teknologier
- **Backend:** Node.js (Express), BullMQ (Redis).
- **Frontend:** React (Vite, TypeScript, Tailwind CSS).
- **AI-Motor:** Google Gemini, OpenCode AI, Lokal Ollama.
- **Dokument-motor:** Pandoc (HTML) & Chromium Headless (PDF).

## 📄 Dokumenter & Features
Systemet genererer 4 centrale dokumenter i hver pakke:
1. **Ansøgning:** Målrettet og professionelt skrevet.
2. **CV:** Skræddersyet til at matche jobopslagets krav.
3. **Match Analyse:** En dyb AI-vurdering af din profil mod jobbet.
4. **ICAN+ Pitch:** Din elevatortale og samtaleguide.

### Særlige funktioner
* **🎯 Job-Radar:** Autonom søgeagent der finder og scorer job fra Jobindex via Chromium scraping.
* **🧠 AI Abstraktion:** Skift lynhurtigt mellem Cloud (Gemini) og Lokale modeller (OpenCode/Ollama).
* **🛡️ Full Traceability:** Avanceret variadic logging sikrer at du altid kan se hvad AI'en "tænker".
* **🎨 Live Preview:** Se dine ændringer i Master CV'et øjeblikkeligt i browseren.

## 📚 Dokumentation
For detaljeret information, se venligst:
- [Brugervejledning](docs/usage_guide.md) - Komplet guide til funktioner.
- [Setup Guide](docs/setup.md) - Installation og konfiguration.
- [AI Guide: Google Gemini (Cloud)](docs/ai_gemini.md)
- [AI Guide: OpenCode AI (LAN)](docs/ai_opencode.md)
- [AI Guide: Ollama (Lokal)](docs/ai_ollama.md)
- [Job-Radar](docs/job_radar.md) - Hvordan radaren finder job til dig.
- [Systemarkitektur](docs/architecture.md) - Teknisk overblik.
- [Coding Standards](docs/coding_standards.md) - Arkitektoniske retningslinjer.
- [API Dokumentation](docs/api.md) - Swagger UI og CLI brug.
- [Feature Checklist (QA)](docs/feature_liste.md) - Validering af systemet.
- [Testvejledning](docs/test.md) - Hvordan du kører unit og integrationstests.
- [Journal & Roadmap](docs/journal.md) - Projektets historik og daglige rettelser.

### Udvikler-dokumentation
- [AGENTS.md](AGENTS.md) - Instrukser til AI-agenter (kodekonventioner, test, build).
- [GEMINI.md](GEMINI.md) - Primær instruks for Gemini CLI og AI-workflow.
- [Alle docs/](docs/) - Komplet liste over systemdokumentation.

---
*Sidst opdateret: 7. april 2026 (v6.0.0)*
