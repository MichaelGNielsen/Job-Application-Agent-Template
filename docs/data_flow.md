<!--
  Job Application Agent - Template Edition
  Softwaren leveres "som den er", uden nogen form for garanti.
  Brug af softwaren sker på eget ansvar.
-->

# Data & Fil-workflow (v6.0.0)

Dette dokument beskriver den præcise proces, der sker fra det øjeblik en bruger trykker "🚀 Start Automatisering", til de færdige dokumenter ligger klar.

## 1. Initialisering & Sprogdetektering
Når et nyt job modtages i backenden:
*   **Mappeoprettelse:** Der oprettes en unik mappe i `output/` med tidsstempel.
*   **Sprogdetektering:** Systemet analyserer den fulde jobtekst via AI for at identificere sproget (da/en). Dette sikrer, at Ansøgning og CV skrives på det korrekte sprog.

## 2. Den Strategiske Pipeline (4 AI-Jobs)
I stedet for ét stort AI-kald, kører systemet nu en sekventiel pipeline for at sikre højere kvalitet og "Den Røde Tråd":
1.  **Match Analyse:** AI'en vurderer matchet og lægger strategien for resten af pakken.
2.  **Målrettet CV:** CV'et optimeres specifikt til denne stilling baseret på Match-analysen.
3.  **Ansøgning:** Skrives med afsæt i strategien og det opdaterede CV.
4.  **ICAN+ Pitch:** En elevatortale/pitch baseret på hele forløbet.

## 3. Dokument-generering (MD -> HTML -> PDF)
For hvert af de fire dokumenter kører følgende proces:
1.  **Markdown (.md):** Brødteksten gemmes som en ren Markdown-fil uden system-tags.
2.  **HTML-Body:** Genereres via `pandoc` (GFM format).
3.  **Master Layout:** Body-teksten flettes ind i `templates/master_layout.html`, hvor CSS og kandidat-højdepunkter (billeder) påføres.
4.  **PDF:** En pixel-perfekt PDF genereres via en headless `chromium-browser`.

## 4. Omdøbning & Quick Access
*   **Intelligent Rename:** Når AI'en har udtrukket firma og stilling, omdøbes mappen automatisk til et læsbart format (f.eks. `2026-04-07_solution_architect_itm8`).
*   **output/new/:** Alle genererede PDF'er kopieres til denne mappe for lynhurtig adgang til de seneste resultater.

## 5. Iterativ Forfinelse (Refine)
*   **Manuel polering:** Rettelser i interfacet opdaterer MD, HTML og PDF øjeblikkeligt (uden AI-kald).
*   **AI Forfin:** Hvis brugeren giver et nyt hint, køres den relevante del af pipelinen igen, og filerne opdateres med de nye AI-forbedringer.

---
*Sidst opdateret: 7. april 2026 (v6.0.0)*
