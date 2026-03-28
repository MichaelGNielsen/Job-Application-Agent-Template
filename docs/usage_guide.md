# Brugervejledning: Job Application Agent MGN (v4.1.0)

Denne guide forklarer de vigtigste funktioner i systemet, og hvordan du bruger dem til at skabe den perfekte ansøgningspakke.

---

## 1. Vedligeholdelse af Master CV (Brutto-CV)
Dit Master CV er fundamentet for alt. Det findes under fanen **📜 Master CV** i System Kartoteket.

- **💾 Gem konfiguration:** Gemmer dine rettelser og opdaterer automatisk HTML og PDF visningen i `data/` mappen.
- **👁️ Vis HTML:** Åbner en preview af dit CV i en ny fane, så du kan tjekke layoutet.
- **📄 Åben PDF:** Viser den professionelle PDF-version, som den vil se ud for en modtager.
- **✨ Optimér med AI:** Bruger Gemini til at fjerne fyldord og floskler efter "Jysk ærlighed" princippet.
- **🌐 Oversæt CV:** Oversætter dit fulde CV til engelsk (bevarer Markdown-formatering).

## 2. Generering af ny Ansøgningspakke
Brug hovedformularen på forsiden til at starte en ny proces.

- **Firma URL:** Indsæt link til firmaets hjemmeside. Agenten vil selv scrape siden for at finde kontekst og adresser.
- **Personligt Hint:** Giv AI'en instrukser, f.eks. "Læg vægt på min erfaring med RTOS" eller "Skriv på et formelt sprog".
- **Jobopslag:** Indsæt den fulde tekst fra jobopslaget.
- **🚀 Start Automatisering:** Agenten analyserer sprog, laver research og genererer Ansøgning, CV, Match-analyse og ICAN+ Pitch.

## 3. Forfinelse (Refine Loop)
Når dokumenterne er genereret, kan du finpudse dem.

- **PREVIEW:** Se dokumentet i dets endelige layout.
- **RET INDHOLD:** Ret direkte i Markdown-teksten.
- **KONTAKT (META):** Ret i metadata som f.eks. modtagerens adresse eller din egen signatur.
- **✨ Forfin alt med AI:** Brug hint-boksen til at give AI'en rettelser til hele pakken (f.eks. "Gør ansøgningen kortere").

## 4. Internationalisering
Agenten detekterer automatisk sproget i jobopslaget.

- Hvis opslaget er på **Engelsk**, vil Ansøgning og CV automatisk blive skrevet på Engelsk.
- Redaktørens Logbog, Match og ICAN+ skrives altid på **Dansk**, så du let kan læse AI'ens overvejelser.

---

## 5. Avanceret: API Dokumentation (Swagger)
For tekniske brugere og udviklere findes der en komplet interaktiv API-dokumentation. Her kan du udforske alle systemets funktioner og teste dem direkte.

- **Krav:** Docker skal køre (`docker compose up -d`).
- **URL:** `http://localhost:3002/api-docs`

---
*Tip: Husk altid at tjekke "AI Ræsonnement" (den blå boks) for at se hvilken strategi agenten har valgt for det specifikke job. Gennemlæs altid dine dokumenter manuelt før afsendelse, og brug eventuelt "Forfin alt med AI" til et ekstra tjek for stavefejl, floskler og professionel tone.*
