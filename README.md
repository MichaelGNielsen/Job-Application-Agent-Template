# Job Application Agent Template

Dette er den officielle version af Job Application Agent Template, optimeret til rigtige ansøgere. Systemet automatiserer processen med at skræddersy ansøgninger og CV'er ved hjælp af AI.

### Sproghåndtering

Systemet er designet til at håndtere internationale jobopslag automatisk:
- **Ansøgning & CV:** Genereres altid på det samme sprog som selve jobopslaget (understøtter Dansk, Engelsk, Tysk, Fransk og Spansk). Dette inkluderer automatisk oversættelse af jobtitler og erfaring fra Brutto-CV'et.
- **Match Analyse & ICAN+ Pitch:** Disse dokumenter genereres altid på **dansk**, da de primært er tiltænkt ansøgerens egen forberedelse og overblik.

## 🚀 Kom i gang

1. **Konfiguration:** Opret en `.env_ai` fil i rodmappen med din Gemini API-nøgle.
2. **Master CV:** Opdater `data/brutto_cv.md` med din personlige erhvervserfaring og kontaktdata.
3. **Start systemet:**
   ```bash
   docker-compose up -d --build
   ```
4. **Adgang:** Åbn `http://localhost:3000` i din browser.

## 📄 Dokumenter

Systemet genererer 4 centrale dokumenter for hvert jobopslag:

1. **Ansøgning (PDF):** Målrettet og professionelt opsat.
2. **CV (PDF):** Skræddersyet til jobbet med fokus på relevante kompetencer.
3. **Match Analyse (PDF):** En objektiv vurdering af, hvor godt din profil matcher jobbet.
4. **ICAN+ Pitch (PDF):** En strategisk guide til jobsamtalen (på dansk).

## 🛠️ Teknologier

* **Backend:** Node.js (Express), BullMQ, Redis.
* **Frontend:** React (Vite, TypeScript, Tailwind CSS).
* **AI:** Google Gemini via Gemini CLI.
* **Layout:** HTML/CSS konverteret til PDF via Chromium Headless.

## 📝 Markdown Formatering

Følg altid disse regler for Markdown-filer for at sikre kompatibilitet:

* Brug `*` til lister.
* Altid en tom linje efter overskrifter.
* Maksimalt én tom linje i træk.
* Kun én H1 pr. fil.

---

*Sidst opdateret: 19. marts 2026 (v3.1.0)*
