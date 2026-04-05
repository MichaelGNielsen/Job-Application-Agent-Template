# v5.0.0 - Den Store Genopstandelse (Clean Slate)

Dato: 2. april 2026
Status: **STABIL & VALIDERET**
Model: `gemini-3-flash-preview` (via gemini-cli)

## Gennemførte rettelser i denne session:
1. **Arkitektur-rypning:** Gået tilbage til `v4.2.1` for at fjerne unødvendig kompleksitet i AI-kaldene.
2. **AI Model Lås:** Implementeret eksplicit model-flag (`--model`) i `backend/utils.js`. Systemet bruger nu konsekvent den definerede model fra `.env`.
3. **Robusthed:** Øget `maxBuffer` for AI-kald til 50MB for at håndtere verbose debug-logs uden at crashe.
4. **Logging:** Farvelagt loggen med hvid tekst for maksimal læsbarhed på Ubuntu-baggrunde.
5. **Layout:** Genindsat det manglende `cv_layout.html`, så Master CV visning og PDF virker perfekt.
6. **Test Suite:** Oprettet `test_generate.sh`, der kører en fuld End-to-End test af hele systemet (AI -> PDF).

## Resultat:
- Alle 14 unit tests i backend er passed.
- Alle 3 frontend tests er passed.
- Manuel test af Job-generering (Coolshop) er gennemført med succes for alle 4 dokumenter (Ansøgning, CV, ICAN, Match).
- Live-edit af dokumenter i frontenden virker og regenererer PDF'er korrekt.

---
*Amaze! Amaze! Amaze!* - Nu er vi klar til at bygge videre på et fundament, vi kan stole på. 🚀
