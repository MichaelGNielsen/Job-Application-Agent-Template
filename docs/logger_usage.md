# Logger Anvendelse (Variadic & Traceable)

Dette dokument beskriver det avancerede lognings-system, der sikrer fuld sporbarhed og nem debugging gennem hele applikationen.

## 🛡️ Det Gyldne Princip for Logging
For at sikre 100% gennemsigtighed følger vi MGN-standarden for logging:
1. **Ingen manuel begrænsning:** Der må aldrig bruges `substring()` eller `slice()` på data (AI-svar, prompts etc.) *før* det sendes til loggeren.
2. **Centraliseret kontrol:** Alt filtrering og trunkering sker udelukkende i `utils/logger.js`.
3. **Fuld Sporbarhed:** Alle vigtige funktioner bør logge deres indgangsparametre (Inputs) og deres returværdier (Outputs).

## 📊 Log-format
Alle logs følger et fast kolonneformat for maksimal vertikal skanbarhed:

`[Tidsstempel][Niveau][Linje][Funktion][Filnavn] - Besked | DATA: arg1 | arg2 | ...`

## 🔊 Verbosity Niveauer
Du styrer mængden af log-output via `VERBOSE` miljøvariablen:

1.  **`VERBOSE=""` (INFO0):** Kun fejl (ERROR), advarsler (WARNI) og basale status-beskeder. Ingen data-argumenter vises.
2.  **`VERBOSE="-v"` (INFO1):** Viser data-argumenter, men afkorter den samlede datastreng ved 500 tegn for læsbarhed i terminalen.
3.  **`VERBOSE="-vv"` (INFO2):** **Fuldstændig logning.** Viser ALT råt og uafkortet (fulde prompts, rå AI-svar, hele HTML-sider).

## 🛠 For udviklere (Variadic API)
Loggeren understøtter et ukendt antal argumenter (variadic), hvilket gør det nemt at logge alle relevante variabler på én gang:

```javascript
const logger = require('./utils/logger');

// Logning af input
logger.info("beregnSkat", "Beregner for bruger", brugerId, indkomst, { aar: 2026 });

// Logning af output
const resultat = { skat: 5000, moms: 1000 };
logger.info("beregnSkat", "Beregning færdig", resultat);

// Fejlhåndtering (Error objekter behandles specielt)
try {
    throw new Error("Forbindelse tabt");
} catch (e) {
    logger.error("minFunktion", "Kritisk fejl opstået", { id: 123 }, e);
}
```

---
*Sidst opdateret: 7. april 2026 (v5.6.8)*
