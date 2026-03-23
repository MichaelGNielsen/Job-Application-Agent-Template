<!--
  Job Application Agent Template
  Designer: MGN (mgn@mgnielsen.dk)
  Copyright (c) 2026 MGN. All rights reserved.
  BEMÆRK: Denne kode anvender AI til generering og behandling.
  Brugeren skal selv verificere, at resultatet er som forventet.
  Softwaren leveres "som den er", uden nogen form for garanti.
  Brug af softwaren sker på eget ansvar.
-->

# AGENTS.md - Job Application Agent Template

Dette dokument beskriver rollen for Job Application Agent Template og hvordan du bruger den nye web-baserede motor.

## 🤖 Formål

Agenten er designet til at transformere din personlige erfaringsbase (Master CV) til skræddersyede, professionelle dokumenter på få sekunder.

## 🚀 Moderne Workflow (Web)

Glem manuelle mapper og scripts. Alt styres nu fra browseren:

1. **Konfiguration**
  * Kopier `.env_ai_template` til `.env_ai` og indsæt din Gemini API-nøgle.
2. **Master CV**
  * Rediger `data/brutto_cv.md` direkte i browseren. Husk at inkludere dine personlige stamdata øverst.
3. **Generering**
  * Indsæt jobopslaget og tryk på "🚀 Start Automatisering".
4. **Refinement**
  * Ret manuelt i Markdown eller brug "✨ Forfin med AI" til at opdatere alle dokumenter kirurgisk.

## 📂 Filstruktur

Systemet organiserer automatisk alt output i `output/` mappen:

* `[timestamp]_[firma]_[stilling]/`
  * `Ansøgning_...pdf`: Den færdige ansøgning.
  * `CV_...pdf`: Dit målrettede CV.
  * `Match_...pdf`: En ærlig score og analyse.
  * `ICAN+_...pdf`: Din interview-strategi.

## 🛠 Værktøjer

Agenten bruger følgende motorer bag kulissen:

* **Gemini 1.5**: Hjernen der skriver og forfiner.
* **Pandoc**: Motoren der sikrer perfekt Markdown-til-HTML konvertering.
* **Chromium**: Genererer pixel-perfekte PDF-filer.
