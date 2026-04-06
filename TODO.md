# 🚀 TODO: Job Application Agent

## 🏗️ Næste Skridt: Konsolidering & Ny Feature-fokus (v5.6.x)

### 🧹 Sidste Arkitektonisk Oprydning
- [x] **Test Refactoring:** Split `utils.test.js` op så den matcher den nye `utils/` struktur (f.eks. `logger.test.js`, `parser.test.js`).
  - *Vigtigt:* Fix Jest timeout og "Open Handles" fejlen i `callLocalGemini()` testen (se `docs/jest_test_failure_log.md`).
- [x] **Socket Service:** Flyt socket.io-logikken fra `server.js` til en dedikeret `services/SocketService.js`.
- [ ] **JSDoc Færdiggørelse:** Gennemgå alle metoder i `ApplicationService.js` og tilføj manglende `@param` og `@returns` dokumentation.
- [ ] **Swagger CSS:** Tilpas Swagger UI med projektets farver (mørkeblå/cyan) for et gennemført look.
- [ ] **Swagger Path Validation:** Automatisk tjek om samtlige ruter defineret i koden er dokumenteret i Swagger.
- [ ] **API Kontrakt-test:** Implementer avancerede kontrakt-tests (f.eks. Prism eller Dredd) for at sikre at API'et svarer præcis som dokumenteret.

### 📡 Nye Features (Roadmap)
- [ ] **Lokal AI Optimering:**
  - [ ] **No-Placeholder Rule:** Tilføj strikse instrukser til prompten om aldrig at bruge `[PLACEHOLDERS]`. Modellen SKAL bruge data fra Brutto-CV.
  - [ ] **Surgical Brutto-CV:** Implementer logik til at reducere størrelsen af Brutto-CV'et (fx kun relevante erfaringer) for at give AI'en mere context-overskud.
- [ ] **Firma-Spejder:** Gør agenten bedre til at opdage helt nye virksomheder i Nordjylland automatisk.
- [ ] **PDF-Deep-Scan:** Gør det muligt for crawleren at læse PDF-jobopslag direkte fra firma-sider (kræver `pdf-parse` integration).
- [ ] **Historik-panel:** En ny fane i UI'en der viser alle tidligere genererede ansøgninger med søgefunktion.

---

## ✅ Gennemført (4. april 2026 - v5.6.0) 🏗️🚀
- [x] **Fuld Backend Refactoring:** Controllers & Services implementeret. `server.js` og `worker.js` er nu slanke.
- [x] **Fuld Frontend Refactoring:** Hooks (`useRadar`, `useApplication`) og modulære komponenter implementeret.
- [x] **Utils Split:** `utils.js` er splittet i et rent bibliotek under `utils/`.
- [x] **Låst Infrastruktur:** Porte (3000, 3002, 6379) og containernavne er faste.
- [x] **Single Source of Truth:** Al konfiguration samlet i én `.env` fil.
- [x] **Auto-Dokumentation:** JSDoc (Doxygen-style) genereres nu automatisk asynkront ved startup.
- [x] **Frontend Logger:** Implementeret signatur-logger i browser-konsollen med CSS-styling.
- [x] **Swagger Færdiggørelse:** Alle ruter er dokumenteret og tilgængelige via Swagger UI.
- [x] **Lokal AI Fallback:** Ollama integreret i separat container med automatisk fallback fra Gemini ved timeout/rate-limits.
- [x] **Ingen Hardcoding:** Person-data fjernet fra `.env`. Branding og initialer udledes nu dynamisk fra Master CV'et, hvilket gør systemet 100% template-klart.
- [x] **AI Test Endpoint:** `/api/ai/test` tilføjet til Swagger for hurtig verifikation af AI-forbindelser.

---
*Sidst opdateret: 4. april 2026 (Efter arkitektonisk modernisering)*
