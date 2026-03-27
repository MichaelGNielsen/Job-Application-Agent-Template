# Setup Guide - Job Application Agent

Denne guide hjælper dig med at sætte din personlige Job Application Agent op på få minutter.

## 1. Identitet & Hemmeligheder
Alt hvad der gør agenten til "din", bor i filen `.env`. 

1.  Kopiér filen `.env_template` til en ny fil med navnet `.env`.
2.  Åbn `.env` og ret den allerøverste linje:
    -   `# IDENTITY_DINE_INITIALER` -> f.eks. `# IDENTITY_KHL`
3.  Indsæt din Google Gemini API nøgle ved `GEMINI_API_KEY=`.

## 2. Din Erfaring (Brutto-CV)
Agenten har brug for at kende din baggrund for at kunne skrive dine ansøgninger.

1.  Gå til mappen `data/`.
2.  Åbn `brutto_cv.md`.
3.  Erstat indholdet med din egen erhvervserfaring, kurser og profil. 
    -   *Tip:* Du kan blot "dumpe" din LinkedIn-profil eller dit gamle Word-CV herind – AI'en finder selv ud af resten, så længe du bruger almindelige overskrifter.

## 3. Start Agenten
Når du har rettet de to filer, er du klar:

1.  Åbn din terminal i projektets rodmappe.
2.  Kør kommandoen: `docker compose up -d --build`
3.  **Adgang til systemet:**
    -   **Frontend (Brugerflade):** `http://localhost:3000`
    -   **Backend (API & Docs):** `http://localhost:3002/api-docs`

## 4. Sådan virker det i browseren
Når du åbner web-siden, vil du se dine initialer (fra din Identity øverst i `.env`) i toppen af siden. Nu skal du blot:
1.  Indsætte et jobopslag.
2.  Trykke på "Generér".
3.  Agenten klarer resten og præsenterer dig for en komplet pakke (Ansøgning, CV, Match-analyse og ICAN+ Pitch).

---
*God jagt!*
