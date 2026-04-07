# Job Radar - Proaktiv Jobsøgning

Job Radaren er systemets "tidlige varslingssystem". Den overvåger markedet og dine egne fundne links for at sikre, at du altid har de mest relevante åbninger klar til behandling.

## 🎯 Kernefunktionalitet

### 1. Manuel Tilføjelse
Du kan indsætte et direkte link (LinkedIn, Jobindex, firma-hjemmeside etc.) i radaren.
- **AI-Analyse:** Systemet bruger Chromium til at besøge linket og udtrækker automatisk jobtitel og firmanavn via din valgte AI-model.
- **Instant Match-Score:** Jobbet bliver holdt op mod dit Master CV, og du får en score (0-100%) samt de to vigtigste grunde til matchet.

### 2. Proaktiv Søgning (Chromium Powered)
Når du trykker på "🚀 Søg nye job", foretager systemet en autonom søgning:
- **Tekniske Søgeord:** Radaren bruger de søgeord, du har defineret i `radar.json` (f.eks. "embedded software", "AI-integration").
- **Områdesøgning:** Der søges på Jobindex baseret på din valgte **Hjemby** og **Radius** (km).
- **Resilient Scraping:** Systemet bruger en headless Chromium-browser (`--dump-dom`) for at omgå cookie-mure og indlæse JavaScript-tunge joblister.
- **Bredde-søgning:** Systemet søger på hvert søgeord individuelt og direkte på dine foretrukne firmaer (**Target Companies**) for at sikre fuld dækning.

### 3. Vedligeholdelse ("Vask Liste")
Med "🧹 Vask" funktionen sikrer systemet, at din radar altid er opdateret:
- **Link-Validering:** Hvert link pinges for at tjekke, om jobbet stadig er aktivt (404-tjek).
- **Udløbskontrol:** Jobs fjernes automatisk, når deres ansøgningsfrist er overskredet.
- **Dublet-rensning:** Systemet sikrer via URL-match, at det samme job ikke optræder flere gange.

## ⚙️ Konfiguration
Alle indstillinger styres i `data/radar.json`:
- **baseCity:** Den by, du søger fra.
- **radius:** Maksimal afstand i km.
- **minScore:** Tærskelværdi for, hvornår et job skal vises i din liste (standard 80).
- **searchKeywords:** Dine tekniske præferencer (AI'en udvider selv disse med synonymer).
- **targetCompanies:** Liste over firmaer, du har særlig interesse i.

## 🧠 AI Integration
Radaren bruger altid den AI-model, du har valgt i **AI Model Vælger** i interfacet. Dette sikrer ensartet kvalitet og mulighed for at køre søgninger via lokale modeller (OpenCode/Ollama) for at undgå rate-limits på Gemini.

---
*Sidst opdateret: 7. april 2026 (v5.6.8)*
