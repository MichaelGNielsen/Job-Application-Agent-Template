# Status Journal - Job Application Agent

Dette dokument fungerer som projektets tekniske hukommelse og strategiske roadmap. Det opdateres før hver væsentlig ændring eller commit.

## 🏁 Status 28. Marts 2026 - Smart Split af Master CV (v4.3.4) 🧠✂️✨

En vigtig rettelse af layout-logikken for at eliminere redundans i de genererede dokumenter.

### 🛠️ Tekniske Milepæle (v4.3.3 -> v4.3.4)
- **Eliminering af Dobbelt-info:** Implementeret en "Smart Split" logik i `generateMasterDocs` (`backend/utils.js`). Systemet genkender nu den første horisontale streg (`---`) i `brutto_cv.md` som skillelinje. 
- **Metadata vs. Indhold:** Alt før stregen (stamdata som navn, adresse osv.) bruges nu udelukkende til at udfylde layout-headeren, mens kun indholdet *efter* stregen renderes til selve dokument-kroppen.
- **Konsistens:** Dette sikrer, at Master CV'et i PDF/HTML format ser professionelt ud uden gentagelse af personlige oplysninger, mens den rå Markdown-fil stadig er komplet og letlæselig.

### ✅ Validering
- Verificeret at personlige oplysninger nu kun optræder én gang (i headeren) på det genererede Master CV.
- Bekræftet at `parseCandidateInfo` stadig trækker de korrekte data til filnavne og headers.
- Synkronisering mellem MGN og Template gennemført.

---

## 🏁 Status 28. Marts 2026 - Differentiere Layout Previews (v4.3.3) 🎨🔍✨
... (resten af journalen)
