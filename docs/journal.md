# Status Journal - Job Application Agent

Dette dokument fungerer som projektets tekniske hukommelse og strategiske roadmap. Det opdateres før hver væsentlig ændring eller commit.

## 🏁 Status 28. Marts 2026 - Differentiere Layout Previews (v4.3.3) 🎨🔍✨

En hurtig forbedring af preview-motoren for at sikre, at brugeren kan se forskel på de forskellige skabeloner under redigering.

### 🛠️ Tekniske Milepæle (v4.3.2 -> v4.3.3)
- **Kontekstuelle Previews:** `getLayoutPreview` funktionen tager nu filnavnet som parameter og returnerer specifikt dummy-indhold baseret på om der redigeres et **CV** eller en **Ansøgning**.
- **Bedre Visualisering:** CV-preview viser nu profil, erhvervserfaring og uddannelse, mens Ansøgnings-preview viser modtager-adresse, emnelinje og brev-tekst. Dette gør det øjeblikkeligt synligt, hvilken skabelon der er aktiv.

### ✅ Validering
- Verificeret at skift mellem `cv_layout.html` og `master_layout.html` nu resulterer i to tydeligt forskellige visninger i PREVIEW-mode.
- Bekræftet at alle tags (`{{CONTENT}}`, `{{NAME}}` etc.) stadig erstattes korrekt i begge modes.

---

## 🏁 Status 28. Marts 2026 - System Kartotek UI Redesign & Optimering (v4.3.2) 🎨🚀✨
... (resten af journalen)
