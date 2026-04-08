# TODO - Job Application Agent (Template)

Dette dokument indeholder planlagte forbedringer og rettelser til den videre udvikling af Template-repoet.

## 🔴 Høj Prioritet (Fejlrettelser & Robusthed)

- **Docker .env Startup Fix:** Docker Compose fejler under opstart hvis `.env` filen mangler pga. `env_file` direktivet. Vores kode-baserede "selvheling" når aldrig at køre.
  - *Løsning:* Opret et `start.sh` script eller tilføj shell-logik der tjekker/kopierer `.env` *før* `docker-compose up -d`.
- **API Nøgle Validering:** Udvid `keyStatus` logikken til også at tjekke om nøglen er teknisk valid (f.eks. ved et hurtigt test-kald til Gemini API) i stedet for kun at tjekke længde/dummy-tekst.

## 🟡 Medium Prioritet (UI/UX & Funktioner)

- **Frontend Tooltips:** Implementer hover-tekst (tooltips) på alle handlingsknapper i frontend for at gøre systemet mere intuitivt.
- **Log Fine-tuning:** Gennemfør en række "Trial Runs" med den nye variadic logging (`-vv`) for at optimere prompts til søgeords-generering i `RadarService`.
- **Resultat Visning:** Forbedre visningen af ICAN+ Pitch i frontend, så den præsenteres som "talepunkter" fremfor blot en tekstblok.

## 🟢 Lav Prioritet (Vedligeholdelse & Docs)

- **Unit Tests:** Tilføj specifikke unit tests for `envHelper.js` og den nye logik i `ConfigController.js`.
- **Dokumentations-rens:** Gennemgå alle `.md` filer i `docs/` og fjern eventuelle forældede referencer til `radar.json_template`.
- **Swagger Cleanup:** Udvid Swagger-dokumentationen til at dække de nye felter i `/api/version` svaret.

---
*Sidst opdateret: 8. april 2026*
