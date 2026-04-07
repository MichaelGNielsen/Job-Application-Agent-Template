# Brugervejledning: Job Application Agent MGN (v5.6.8)

Denne guide forklarer de vigtigste funktioner i systemet, og hvordan du bruger dem til at skabe den perfekte ansøgningspakke.

---

## 1. Vedligeholdelse af Master CV (Brutto-CV)
Dit Master CV er fundamentet for alt. Det findes under fanen **📜 Master CV** i System Kartoteket.

- **💾 Gem Master CV:** Gemmer dine rettelser og opdaterer automatisk HTML og PDF visningen.
- **👁️ Vis Preview:** Viser en live HTML-visning af dit CV direkte i interfacet.
- **📄 PDF:** Åbner den professionelle PDF-version i en ny fane.
- **✨ AI Optimér:** Bruger AI til at optimere dit CV efter "Jysk ærlighed" princippet (fjerner floskler og gør det skarpt).

## 2. Proaktiv Job-Radar
Job-Radaren overvåger Jobindex og finder relevante stillinger automatisk. Findes under fanen **🎯 Job-Radar**.

- **Hjemby & Radius:** Konfigurér hvor du søger fra, og hvor langt du vil pendle.
- **Søgeord:** Radaren bruger dine tekniske søgeord (fra `radar.json`) og kombinerer dem med dit CV for at finde det bedste match.
- **Match Score:** AI'en scorer hvert fundet job (0-100%) og forklarer *hvorfor* det er et godt eller dårligt match.
- **🚀 Automatisér:** Ved ét klik overføres alle job-detaljer til hovedformularen, så du kan generere ansøgningen med det samme.

## 3. Generering af ny Ansøgningspakke
Brug hovedformularen på forsiden til at starte en ny proces.

- **Firma URL:** (Valgfrit) Agenten scraper firmaets side for kontekst og adresse.
- **AI Model Vælger:** Vælg mellem Google Gemini, OpenCode eller lokal Ollama. Systemet husker din favorit.
- **Personligt Hint:** Giv AI'en instrukser, f.eks. "Læg vægt på min erfaring med RTOS".
- **Jobopslag:** Indsæt den fulde tekst fra jobopslaget.
- **🚀 Start Automatisering:** Agenten genererer Ansøgning, CV, Match-analyse og ICAN+ Pitch i én arbejdsgang.

## 4. Forfinelse (Refine Loop)
Når dokumenterne er genereret, kan du finpudse dem under **Resultater**.

- **PREVIEW:** Se dokumentet i dets endelige layout.
- **RET INDHOLD:** Ret direkte i Markdown-teksten. Gemmer automatisk dine rettelser.
- **✨ AI Forfin:** Brug hint-feltet ved det enkelte dokument til at bede om specifikke rettelser (f.eks. "Gør mere formel").
- **✨ Forfin alt med AI:** (Den store knap) Opdaterer hele pakken baseret på et nyt hint eller rettelser i jobteksten.

## 5. Internationalisering
Agenten detekterer automatisk sproget i jobopslaget.

- Hvis opslaget er på **Engelsk**, skrives Ansøgning og CV automatisk på engelsk.
- Redaktørens noter, Match-analyse og ICAN+ skrives altid på **Dansk** for hurtigt overblik.

---

## 6. Overvågning & Logs
Hvis du vil se hvad agenten "tænker" eller fejlsøge:
- **Status Journal:** Se de seneste tekniske ændringer i **[journal.md](journal.md)**.
- **Terminal Logs:** Kør Docker med `-v` eller `-vv` for at se AI-svar og systemets variadic logs i realtid.

---
*Tip: Tjek altid "AI Ræsonnement" (den blå boks) før du retter. Det giver dig indsigt i AI'ens strategi for det pågældende job.*
