# AI Guide: OpenCode Server (LAN)

OpenCode AI Server fungerer som en centraliseret AI-backend på dit lokale netværk (LAN). Den er ideel til hurtig, lokal inferens uden cloud-afhængigheder.

## 🚀 LAN Tilgængelighed

Serveren er konfigureret til at lytte på `0.0.0.0`, hvilket gør den tilgængelig fra alle enheder på netværket:
- **Lokal maskine:** `http://localhost:4096`
- **Netværk:** `http://<VÆRTENS-IP>:4096`

## 🛠 Test via CURL (2-trins proces)

OpenCode bruger et session-baseret API. Her er hvordan du tester det manuelt:

### 1. Opret en ny session
Først skal du hente et `id` (session ID):

```bash
curl -X POST http://localhost:4096/session
```
*Returnerer JSON med et `id` (f.eks. `ses_abc123`).*

### 2. Send din besked
Brug det modtagne ID (erstat `SESSION_ID` herunder) for at sende din prompt:

```bash
curl -X POST http://localhost:4096/session/SESSION_ID/message \
     -H "Content-Type: application/json" \
     -d '{ "parts": [{ "type": "text", "text": "Hvad er 2+2? Svar kun med tallet." }] }'
```

## 🧠 Arkitektur

OpenCode er bygget til at være resilient og hurtig. Den håndterer sessioner uafhængigt af hinanden, hvilket gør det muligt at køre flere parallelle AI-opgaver på tværs af dit LAN.

---
*Sidst opdateret: 7. april 2026*
