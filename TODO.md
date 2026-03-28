# TODO LIST - JOB APPLICATION AGENT

Dette er den aktive roadmap for videreudvikling af agenten. Opgaverne er prioriteret efter deres værdi for ansøgerens workflow.

## ✅ Færdiggjort (v4.3.0)
- [x] **Robusthed (v4.3.0):** Hævet `maxBuffer` til 50MB for at håndtere tunge AI-kald og logs.
- [x] **Log-Triggers (v4.3.0):** Nye test-scripts (`test_generate.sh`, `test_cv_refine.sh`) til API-verificering.
- [x] **Docker Autentificering (v4.3.0):** Mapper `.gemini` folder ind i containeren for fuld profil-understøttelse.
- [x] **Miljø-fil Standardisering (.env) (v4.2.6):** Omdøbt `.env_ai` til `.env` og samlet konfiguration centralt.
- [x] **Master CV Visualizer (v4.1.0):** Automatisk HTML/PDF generering direkte fra Brutto-CV editor.
- [x] **AI Refine (Master) (v4.2.0):** Interaktiv optimering af Brutto-CV med AI-logbog.
- [x] **Drebin Spinner (v4.2.1):** Spejlet, indadborende loading-animation for visuel konsistens i hele UI.
- [x] **Brugervejledning:** Oprettet `docs/usage_guide.md` og opdateret README.
- [x] **Internationalisering (CV):** Bedre håndtering af job-specifikke oversættelser af historik.

## 🚀 Roadmap / Kommende Features (v5.0+)
- [ ] **Job-Radar (Proaktiv Search):** 🎯
  - **Geofencing:** Radius-baseret søgning (f.eks. 30 km fra adresse i Brutto-CV).
  - **Auto-Matcher:** Løbende søgning på portaler (Jobindex/LinkedIn) baseret på Brutto-CV kompetencer.
  - **"Nye Muligheder" fane:** Dashboard med AI-scorede jobopslag og direkte import-knap.
- [ ] **E-mail Integration:** Mulighed for at sende færdige PDF-pakker direkte fra UI'et.
- [ ] **LinkedIn Parser:** Import af erhvervserfaring direkte fra profil-URL.
- [ ] **Firma Research v2:** Dybere analyse af virksomhedens værdier og teknologiske stack (GitHub/Medium parsing).

## 🛠️ Tekniske Forbedringer
- [ ] **Redis Monitoring:** Bedre visualisering af kø-status i frontenden.
- [ ] **GDPR Anonymisering:** Automatisk fjernelse af følsomme data ved eksport af logs.
- [ ] **Vite v6 Opgradering:** Modernisering af frontend build-tooling.

---
*Sidst opdateret: 28. marts 2026*
