# AI Guide: Google Gemini (Cloud)

Gemini er systemets primære AI-model og tilgås via Google Cloud. Den er optimeret til komplekse opgaver som ansøgningsskrivning og CV-skræddersyning.

## 🚀 Opsætning & Forbindelse

Systemet bruger `gemini` CLI-værktøjet, som er præinstalleret i backend-containeren.

### API Nøgle vs. OAuth
For at køre Gemini skal du enten have en API-nøgle eller være logget ind via OAuth:
1. **API Nøgle:** Sæt `GEMINI_API_KEY` i din `.env` fil.
2. **OAuth (Anbefalet):** Kør `gemini login` lokalt på din maskine. Dette giver højere kvoter og færre rate-limits i EU.

## 🛠 Test via CLI (Inde i Docker)

Du kan verificere forbindelsen direkte fra terminalen uden at bruge web-interfacet:

```bash
docker exec -e GEMINI_TELEMETRY_ENABLED=false -it jaa-backend bash -c 'echo "Hvad er 2+2? Svar kun med tallet." | gemini --model gemini-2.5-flash-lite'
```

## ⚠️ Rate Limits & Telemetri

- **HTTP 400 Fejl:** Hvis du ser `Error flushing log events: HTTP 400`, er det blot telemetri-data, der fejler. Det påvirker IKKE AI-svarene.
- **Deaktivering af Telemetri:** Sæt `GEMINI_TELEMETRY_ENABLED=false` i miljøvariablerne for at slippe for fejlbeskeden.

---
*Sidst opdateret: 7. april 2026*
