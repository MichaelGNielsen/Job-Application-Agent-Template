# Data & Fil-workflow (Processing Flow)

Dette dokument beskriver den præcise proces, der sker fra det øjeblik en bruger trykker "Generér", til de færdige PDF-filer ligger klar.

## 1. Job-Initialisering & Midlertidig Mappe

Når et nyt job modtages i backenden, oprettes der øjeblikkeligt en unik mappe i `output/`.

*   **Navngivning:** Mappen får et midlertidigt navn baseret på tidsstempel og de første informationer systemet har (f.eks. `2026-03-18_08_firma_stilling`).
*   **Sprogdetektering:** Systemet analyserer de første 500 tegn af jobopslaget for at identificere sproget (Dansk, Engelsk, Tysk, Fransk osv.) via AI. Dette sikrer, at svar-tonen matcher opslaget.

## 2. AI-Generering & Intelligent Omdøbning

Worker-processen sender jobopslaget og brugerens CV til AI'en. AI'en bliver bedt om at foreslå et optimalt mappenavn baseret på den faktiske stillingsbetegnelse og virksomhed.

*   **Rename Flow:** Så snart AI'en returnerer det første udkast, omdøbes mappen (f.eks. fra det generiske `..._stilling` til `2026-03-18_08_senior_investigator_interpol`).
*  **Sektionsopdeling:** AI-outputtet splittes automatisk op i de fire kerne-dokumenter:
    1.  **Ansøgning** (`Ansøgning_Kandidat_...`)
    2.  **CV** (`CV_Kandidat_...`)
    3.  **Match Analyse** (`Match_Analyse_Kandidat_...`)
    4.  **ICAN+ Pitch** (`ICAN+_Pitch_Kandidat_...`)

## 3. Konvertering (MD -> HTML -> PDF)

For hvert af de fire dokumenter kører følgende kæde:
1.  **Markdown (.md):** Gemmes som kilde-fil.
2.  **HTML-Body:** Genereres via `pandoc` (GitHub Flavored Markdown).
3.  **Full HTML:** Body-teksten indsættes i `templates/master_layout.html`, hvor CSS og design påføres.
4.  **PDF:** En "pixel-perfekt" PDF genereres via en headless `chromium-browser`.

## 4. Opsamling i `output/new/` (Quick Access)

Som en ekstra service til brugeren, bliver alle færdiggenererede PDF-filer kopieret til en central opsamlingsmappe:

*   **Sti:** `output/new/`
*   **Formål:** At give hurtig adgang til de absolut nyeste filer uden at skulle navigere i de datostemplede undermapper.
*   **Rydning:** Denne mappe fungerer som en "buffer" af de seneste resultater.

## 5. Manuel vs. AI Refinement

*   **Manuel Ret:** Hvis brugeren retter i editoren, opdateres MD, HTML og PDF i den specifikke job-mappe øjeblikkeligt (uden at bruge AI-tokens).
*   **AI Refinement:** Hvis brugeren giver et nyt "hint", køres loopet igen, og de eksisterende filer overskrives med de opdaterede versioner fra AI'en.

---
*Sidst opdateret: 18. marts 2026*
