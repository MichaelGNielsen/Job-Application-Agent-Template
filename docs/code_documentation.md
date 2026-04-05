# Intern Kodedokumentation (JSDoc & TypeDoc)

Dette projekt bruger automatiserede værktøjer til at generere teknisk dokumentation direkte fra kildekoden. Det svarer til Doxygen (C++) eller Sphinx (Python).

## 📂 Lokation & Struktur
Dokumentationen er opdelt i to hovedsektioner:
- **Backend:** `docs/code/backend/` (Genereret via JSDoc)
- **Frontend:** `docs/code/frontend/` (Genereret via TypeDoc)

Du kan åbne den fælles indgangsside i din browser:
- **`docs/code/index.html`**

## 🚀 Generering af dokumentation
Som standard genereres dokumentationen automatisk i baggrunden hver gang Docker-systemet starter op. Hvis du vil køre den manuelt, kan du bruge disse kommandoer:

**Backend (Manual):**
```bash
docker exec jaa-backend npm run docs
```

**Frontend (Manual):**
```bash
docker exec jaa-frontend npm run docs
```

## ✍️ Hvordan man dokumenterer koden
For at sikre at manualerne altid er opdaterede, skal ny kode følge disse standarder:

### Backend (JavaScript)
Brug JSDoc tags som `@module`, `@category Backend`, `@param` og `@returns`.
```javascript
/**
 * @module Utils/Logger
 * @category Backend
 */
```

### Frontend (TypeScript)
TypeDoc læser automatisk dine TypeScript-typer og interfaces. Du kan tilføje ekstra forklaringer med almindelige JSDoc-kommentarer.

## 🛠️ Fordele
- **Auto-genereret:** Altid i synk med den kørende kode.
- **Hierarkisk:** Menu-opdelt i Backend og Frontend.
- **Type-sikkerhed:** Giver bedre IntelliSense i din editor.

---
*Sidst opdateret: 4. april 2026 (v5.6.0)*
