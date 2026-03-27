# Logger Anvendelse

Dette dokument beskriver det avancerede lognings-system (High-Alignment Logger) introduceret for at sikre sporbarhed og nem debugging.

## 📊 Log-format

Alle logs følger et fast kolonneformat for maksimal vertikal skanbarhed:

`[Tidsstempel][Niveau][Linje][Funktion][Filnavn] - Besked | DATA: {ekstra info}`

Eksempel:
`[2026-03-23T14:20:01.123Z][INFO1][00142][printToPdf     ][utils.js    ] - Genererer PDF | DATA: {"jobId": "job_123"}`

## 🔊 Verbosity Niveauer

Du styrer mængden af log-output via `VERBOSE` variablen i din `.env` fil:

1.  **`VERBOSE=""` (INFO0):** Kun fejl (ERROR), advarsler (WARNI) og helt basale status-beskeder.
2.  **`VERBOSE="-v"` (INFO1):** Viser data-objekter, men afkorter dem ved 500 tegn for at spare plads.
3.  **`VERBOSE="-vv"` (INFO2):** Fuldstændig logning. Viser ALT (fulde prompts, rå AI svar osv.).

**Vigtigt:** Fejl (`WARNI`, `ERROR`, `FATAL`) tvinger altid loggen til maksimal detaljegrad (INFO2 format), så du ikke behøver at genstarte for at finde fejlen.

## 🛠 For udviklere

Loggeren er implementeret i `backend/utils.js` og kan importeres i alle backend-moduler:

```javascript
const { logger } = require('./utils');

logger.info("minFunktion", "Alt kører som det skal");
logger.error("minFunktion", "Noget gik galt", { id: 123 }, error);
```

---
*Se `VERSION` filen for aktuel systemstatus.*
