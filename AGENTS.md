<!--
  Job Application Agent Template
  Designer: MGN (mgn@mgnielsen.dk)
  Copyright (c) 2026 MGN. All rights reserved.
  BEMÆRK: Denne kode anvender AI til generering og behandling.
  Brugeren skal selv verificere, at resultatet er som forventet.
  Softwaren leveres "som den er", uden nogen form for garanti.
  Brug af softwaren sker på eget ansvar.
-->

# AGENTS.md - Job Application Agent Template

Dette dokument beskriver rollen for Job Application Agent Template og hvordan du bruger den nye web-baserede motor.

## 🤖 Formål

Agenten er designet til at transformere din personlige erfaringsbase (Master CV) til skræddersyede, professionelle dokumenter på få sekunder.

## 🚀 Moderne Workflow (Web)

Glem manuelle mapper og scripts. Alt styres nu fra browseren:

1. **Konfiguration**
   * Kopier `.env_template` til `.env` og indsæt din Gemini API-nøgle.
2. **Master CV**
   * Rediger `data/brutto_cv.md` direkte i browseren. Husk at inkludere dine personlige stamdata øverst.
3. **Generering**
   * Indsæt jobopslaget og tryk på "🚀 Start Automatisering".
4. **Refinement**
   * Ret manuelt i Markdown eller brug "✨ Forfin med AI" til at opdatere alle dokumenter kirurgisk.

## 📂 Filstruktur

Systemet organiserer automatisk alt output i `output/` mappen:

* `[timestamp]_[firma]_[stilling]/`
  * `Ansøgning_...pdf`: Den færdige ansøgning.
  * `CV_...pdf`: Dit målrettede CV.
  * `Match_...pdf`: En ærlig score og analyse.
  * `ICAN+_...pdf`: Din interview-strategi.

## 🛠 Værktøjer

Agenten bruger følgende motorer bag kulissen:

* **Gemini 1.5**: Hjernen der skriver og forfiner.
* **Pandoc**: Motoren der sikrer perfekt Markdown-til-HTML konvertering.
* **Chromium**: Genererer pixel-perfekte PDF-filer.

---

# Udvikler Guide (For Agenter)

## 🏗️ Projekt Arkitektur

```
├── backend/           # Node.js/Express API (CommonJS, Jest)
│   ├── controllers/   # HTTP request handlers
│   ├── services/      # Business logic (ApplicationService, RadarService)
│   ├── services/ai/   # AI providers (Gemini, Ollama, OpenCode)
│   ├── utils/         # Utility functions
│   └── server.js      # Main entry, Swagger docs live HERE
├── frontend/          # React/TypeScript (ESM, Vitest)
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── hooks/     # Custom React hooks
│   │   ├── services/  # API client
│   │   └── utils/     # Helpers, logger
│   └── vite.config.ts
├── data/              # Master CV (brutto_cv.md)
├── templates/         # Layout & prompt templates
└── output/            # Generated documents (gitignored)
```

## 📦 Kommandoer

### Backend
```bash
cd backend

# Test
npm test                           # Alle tests
npm test -- --testPathPattern=wrap # Kør single test fil
npm test -- -t "bør indsætte"      # Kør tests matching string

# Development
npx nodemon server.js              # Auto-restart on changes

# Docs
npm run docs                        # Generate JSDoc
```

### Frontend
```bash
cd frontend

# Dev & Build
npm run dev                         # Start dev server (port 3000)
npm run build                       # Production build
npm run preview                     # Preview production build

# Test
npm test                           # Run all tests (non-interactive)
npm test --                        # Watch mode
npm test -- --run src/utils/       # Run specific file/folder
npm test -- --coverage             # With coverage report

# Typecheck
npx tsc --noEmit                   # TypeScript validation
```

## 📝 Kode Konventioner

### Backend (JavaScript - CommonJS)

**Filstruktur:**
- One class per file
- File naming: `PascalCase.js` for classes, `camelCase.js` for utilities
- Tests: `*.test.js` next to source files
- JSDoc comments on all exported functions/classes

**Imports/Exports:**
```javascript
// Imports
const express = require('express');
const { mdToHtml, wrap, logger } = require('./utils');

// Exports
module.exports = MyClass;
module.exports = { helper1, helper2 };
```

**Class Pattern:**
```javascript
/**
 * Service description.
 * Overholder SRP og Dependency Injection.
 */
class MyService {
    constructor(deps) {
        this.logger = deps.logger;
        this.fs = deps.fs;
        // Store deps as instance properties
    }
    
    async myMethod(param) {
        this.logger.info("MyService", "Message", { context });
        // ... implementation
    }
}
```

**Naming:**
- Classes: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Private methods: `_prefixedWithUnderscore`
- Logger context: Use class name as first param

**Error Handling:**
```javascript
try {
    // operation
} catch (error) {
    this.logger.error("ClassName", "KRITISK FEJL", { jobId }, error);
    throw error; // Re-throw for caller
}
```

### Frontend (TypeScript/React - ESM)

**Component Pattern:**
```typescript
// hooks/useXxx.ts - Custom hooks for business logic
export const useXxx = (socket: any) => {
    const [state, setState] = useState<Type>(initial);
    // Return object with all state and handlers
    return { state, setState, handler };
};

// components/Xxx.tsx - Presentational components
interface Props {
    title: string;
    onAction: () => void;
}

export const XxxSection: React.FC<Props> = ({ title, onAction }) => {
    return <div>...</div>;
};
```

**Imports:**
```typescript
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { logger } from '../utils/logger';
import { SomeComponent } from './SomeComponent';
```

**Naming:**
- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` (use prefix in usage)
- Types/Interfaces: `PascalCase`
- File organization: hooks/, components/, services/, utils/

**State Management:**
- Local state with useState
- Props drilling acceptable for <5 levels
- Complex state goes in custom hooks
- Socket events handled in useApplication hook

**TypeScript:**
- `strict: true` in tsconfig.json
- Avoid `any` - use proper types
- Use `interface` for object shapes
- Export types from their files

### Testing Patterns

**Backend (Jest):**
```javascript
jest.mock('fs');

describe('wrap()', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fs.readFileSync.mockReturnValue('<html>...</html>');
    });

    test('bør beskrive expected behavior', () => {
        const result = wrap('Titel', 'Indhold', 'ansøgning', {}, {});
        expect(result).toContain('Indhold');
    });
});
```

**Frontend (Vitest + Testing Library):**
```typescript
import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';

vi.mock('socket.io-client', () => ({
    io: vi.fn(() => ({ on: vi.fn(), emit: vi.fn() }))
}));

test('renders headline', () => {
    render(<MyComponent />);
    expect(screen.getByText(/Expected/i)).toBeDefined();
});
```

## 🎨 API Design (Backend)

**Swagger Documentation:**
- ALL @openapi blocks MUST be in `server.js` directly above their routes
- This ensures "Try it out" works correctly
- See `server.js:64-68` for the important lesson

**Route Pattern:**
```javascript
/**
 * @openapi
 * /api/resource:
 *   get:
 *     summary: Hent alle
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: Succes
 */
app.get('/api/resource', (req, res) => controller.method(req, res));
```

**Controller Pattern:**
```javascript
class MyController {
    constructor(deps) {
        this.service = deps.service;
    }
    
    method(req, res) {
        this.service.operation()
            .then(data => res.json(data))
            .catch(err => res.status(500).json({ error: err.message }));
    }
}
```

## 🔌 AI Provider Integration

Three interchangeable providers in `backend/services/ai/`:
- `GeminiProvider.js` - Google Gemini
- `OllamaProvider.js` - Local Ollama
- `OpenCodeProvider.js` - OpenCode agent

All implement the same interface via `AiManager.js`:
```javascript
class BaseProvider {
    async call(prompt, jobId, model) { /* ... */ }
}
```

Add new providers by implementing the same interface.

## 📋 Daglige Kontrolpunkter

1. Kør tests: `cd backend && npm test` og `cd frontend && npm test`
2. Typecheck frontend: `cd frontend && npx tsc --noEmit`
3. Tjek at `.env` er korrekt konfigureret
4. Verificer at Redis køer kører (for AI jobbehandling)

## ⚠️ Vigtige Bemærkninger

1. **Swagger docs location**: Altid i `server.js`, aldrig i controllers
2. **Root dir i Docker**: `/app/shared` - Bruges til at finde config/data
3. **Swappable AI**: Systemet falder tilbage mellem providers ved fejl
4. **BullMQ kø**: Sikrer seriel AI-behandling (ingen parallel concurency)
5. **Output organization**: Hver ansøgning i timestamped folder
