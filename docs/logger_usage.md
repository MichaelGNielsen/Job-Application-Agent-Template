# Logger Anvendelse (v3.5)

Job Application Agent (JAA) benytter et høj-præcisions lognings-system med fast kolonnebredde for at sikre optimal læsbarhed (alignment) i terminalen.

## Oversigt over niveauer

Log-niveauet styres via `VERBOSE` i `.env_ai`.

| Flag | Niveau | Navn | Beskrivelse | Data-håndtering |
| :--- | :---: | :--- | :--- | :--- |
| (tom) | 0 | **INFO0** | Standard milepæle. | Ingen data-blok. |
| `-v` | 1 | **INFO1** | Detaljeret info. | Data forkortes til 500 tegn. |
| `-vv` | 2 | **INFO2** | Fuld gennemsigtighed. | Alt logges (uafkortet). |

## Fast Kolonne-Format

For at undgå at loggen "hopper", benyttes faste bredder til alle metadata-felter:

`[Tidsstempel][Niveau][Linje][Funktion       ][Filnavn     ] - Besked`

### Eksempel på output:
```text
[2026-03-23T15:30:01Z][INFO0][00120][Worker         ][worker.js   ] - Job startet
[2026-03-23T15:30:05Z][INFO1][00150][callLocalGemini][worker.js   ] - Sender prompt | DATA: {"tegn":1200}
[2026-03-23T15:30:10Z][WARNI][00085][fetchCompany   ][utils.js    ] - Langsom respons | DATA: {"url":"..."}
[2026-03-23T15:30:12Z][ERROR][00210][printToPdf     ][utils.js    ] - PDF fejlede | DATA: {"path":"..."}
```

## Særlige Regler

1.  **Kritiske fejl (WARNI/ERROR/FATAL):** Kører **altid med Niveau 2 (INFO2)** detaljegrad. Det betyder, at du altid får filnavn, linjenummer, funktion og fuld fejl-data uanset verbosity-indstillingen.
2.  **Farver:**
    -   **Grøn:** INFO0
    -   **Cyan:** INFO1
    -   **Magenta:** INFO2
    -   **Gul:** WARNI (Advarsler)
    -   **Rød:** ERROR / FATAL (Fejl)

---
*Sidst opdateret: 23. marts 2026*
