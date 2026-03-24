# TODO - Job Application Agent

Denne liste indeholder planlagte forbedringer, teknisk gæld og nye features. Punkterne er prioriteret efter vigtighed for systemets stabilitet og brugervenlighed.

## 🔴 Høj Prioritet (Arkitektur & Stabilitet)

- [x] **Refactoring til utils.js (DRY):** Flyt fælles funktioner fra `server.js` og `worker.js` til `utils.js`.
  - [x] `callLocalGemini`
  - [x] `parseCandidateInfo`
  - [x] `extractSection`
- [ ] **Udvidet Unit-test:** Opdater `utils.test.js` til at dække `printToPdf` ved brug af mocks til `exec`.
- [ ] **Integrationstests:** Opret `test_api.sh` der tester backend-endpoints via `curl` direkte i Docker.

## 🟡 Medium Prioritet (Features)

- [ ] **Proaktiv Jobsøgning:** Agenten skal automatisk kunne finde 1 nyt relevant jobopslag hver dag, der matcher brugerens profil.
  - [ ] Geografisk begrænsning: Radius på 20-30 km fra bopæl.
  - [ ] Matching-logik: Brug AI til at screene opslag og kun præsentere de bedste matches.
- [ ] **Intelligent Brutto-CV Import:** Funktion til at transformere ustruktureret tekst (f.eks. LinkedIn-eksport eller rå tekst) til det korrekte `brutto_cv.md` format.
  - [ ] Automatiske overskrifter og listemarkører.
  - [ ] Udtrækning af stamdata (Navn, Adresse, etc.).
- [ ] **Bulk Export:** Implementer en "Download Alle PDF'er" knap i frontenden, der pakker dokumenterne (evt. som ZIP eller blot trigger multiple downloads).
- [ ] **Sproglig Konsistens:** Verificer sprogregler (i18n) med komplekse internationale opslag (Tysk/Fransk/Spansk) for at sikre, at "Høfligheds-fejlen" er helt væk.
- [ ] **Billed-håndtering:** Optimering af billed-stier i CV, så de virker både i backend-PDF og manuelt browser-print (Serving via Express).

## 🟢 Lav Prioritet (UX & Polering)

- [ ] **Editor Auto-resize:** Gør textarea i editoren selv-justerende i højden baseret på indhold.
- [ ] **Mørkt Tema Polering:** Finpuds Tailwind-farverne for endnu bedre læsbarhed i "Technical Editor" mode.
- [ ] **Status Historik:** Vis en liste over de seneste 5 genererede jobs direkte i frontenden for hurtig adgang.

---
*Sidst opdateret: 24. marts 2026*
