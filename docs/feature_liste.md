# Feature & Test Checklist (v5.6.8)

Dette dokument bruges til at validere og kvalitetssikre (QA) funktionerne i Job Application Agenten. Brug dette som en tjekliste for at sikre, at systemet opfører sig som forventet.

## 🟢 Kernefunktionalitet
- [x] **Ny Job-Generering:** Systemet eksekverer Match -> CV -> Ansøgning -> ICAN+ sekventielt. Resultatet hænger logisk sammen ("Den Røde Tråd").
- [x] **Web-Scraping (Chromium):** Agenten henter indhold udenom cookie-mure via `chromium-browser --dump-dom`.
- [x] **Lokal Tidszone (TS):** Filnavne og log-tidsstempler respekterer lokal dansk tid (CEST/CET).
- [x] **Resilient JSON Parsing:** AI-Manager kan håndtere og selv-rette småfejl i AI'ens JSON-svar (manglende kommaer etc.).

## 🛡️ Kode & Arkitektur Regler
- [x] **Det Gyldne Princip for Logging:** Ingen manuelle begrænsninger før logning. Al filtrering sker centralt i `logger.js`.
- [x] **AI-Abstraktion:** Frontend er blind over for hvilken AI-provider der bruges. Alt normaliseres i backenden.
- [x] **Variadic Logging:** Systemet understøtter fuld sporbarhed af alle inputs og outputs.
- [x] **timeUtils.js:** Der bruges aldrig native `toISOString()` (UTC), kun lokale tidsstempler.

## 🟢 UI & Oplevelse
- [x] **AI Model Vælger:** Dynamisk valg mellem Gemini, OpenCode og Ollama direkte i interfacet.
- [x] **Drebin Spinner:** Alle knapper der arbejder (Gem, Tilføj, Søg, Optimér) viser den animerede spiral-spinner.
- [x] **Live Preview:** Master CV kan redigeres i Markdown og ses live som færdigt HTML-layout.
- [x] **Status Beskeder:** Brugeren får realtids-opdateringer om hvad systemet laver ("Analyserer...", "Genererer CV..." etc.).

## 🟢 Job-Radar (Proaktiv)
- [x] **Chromium Search:** Radaren bruger Chromium til at hente resultater fra Jobindex stabilt.
- [x] **Individuel Keyword Søgning:** Radaren søger på hvert søgeord individuelt for at maksimere bredden af fundne jobs.
- [x] **Target Company Tracking:** Radaren søger specifikt på din personlige liste over favorit-firmaer.
- [x] **Smart Deduplikering:** Systemet genkender eksisterende jobs via URL og opdaterer dem hvis de findes igen.
- [x] **Match Scoring:** Hvert job scores (0-100) baseret på dit Master CV med konfigurerbar tærskelværdi (`minScore`).

## 🟢 AI-Forfinelse (Refine)
- [x] **Dokument-Specifik Hinting:** Individuel AI-hjælp til hver del af pakken.
- [x] **Partiel Refine:** AI'en kan forfine ét dokument uden at ødelægge de andre.
- [x] **Model Hukommelse:** Systemet gemmer din foretrukne AI-model for hver provider.

---
**Status-ikoner:**
- [x] Gennemført & Testet
- [ ] Mangler / Fejler
- [~] Under observation
