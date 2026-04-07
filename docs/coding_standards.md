# Coding Standards & Arkitektur

Dette dokument definerer de tekniske og arkitektoniske retningslinjer for **Job Application Agent** projektet. Alle kodeændringer og nye moduler SKAL overholde disse principper.

## 🏗️ Arkitektoniske Principper

### 1. Modularitet (Single Responsibility)
- Hver fil, klasse og funktion skal have ét klart ansvarsområde.
- Undgå "God Objects" (klasser der gør alt). Hvis en klasse håndterer både data-hentning, transformering og disk-skrivning, skal den splittes op.
- Moduler skal være uafhængige og lette at udskifte.

### 2. Dependency Injection (DI)
- Klasser og funktioner må ikke selv instantiere deres afhængigheder (undgå `new BusinessLogic()` inde i en constructor).
- Afhængigheder skal "indsprøjtes" udefra (via constructor eller argumenter).
- Dette sikrer, at modulerne er testbare (ved brug af mocks/stubs) og løst koblede.

### 3. Små Enheder vs. Store Klasser
- Foretræk komposition over arv.
- **Grænseværdier:** 
  - Filer bør som udgangspunkt ikke overstige 250-300 linjer. 
  - Funktioner bør være overskuelige (typisk under 20-30 linjer).
  - **Utils Struktur:** Hver utility-funktion skal have sin egen fil (f.eks. `utils/parseCandidateInfo.js`). Dette gør det let at finde og teste individuelle funktioner.
  - Hvis kompleksiteten stiger, skal logikken uddelegeres til mindre hjælpefunktioner eller specialiserede klasser.

## 💻 Kodestil

### 1. Navngivning
- Brug sigende navne (undgå `data`, `info`, `process`). Navnet skal fortælle *hvad* variablen indeholder eller *hvad* funktionen gør.
- **Backend (Node.js):** camelCase til variabler/funktioner, PascalCase til klasser.
- **Frontend (React):** PascalCase til komponenter og typer.

### 2. Fejlhåndtering
- Brug altid `try/catch` blokke ved asynkrone operationer.
- Fejl skal logges via systemets logger og kastes videre med meningsfuld kontekst, hvis de ikke kan håndteres lokalt.

### 3. Asynkronitet
- Brug altid `async/await` frem for `.then()` kæder for bedre læsbarhed.

## 🛡️ Operationelle Standarder & Logging (VIGTIGT)

### 1. Centraliseret Log-filtrering (Det Gyldne Princip)
Dette princip er afgørende for systemets gennemsigtighed og fejlsøgning:
- **INGEN MANUELLE BEGRÆNSNINGER:** Der må **ALDRIG** bruges `substring()`, `slice()` eller lignende til at forkorte data (AI-svar, HTML-indhold, CV-tekst) *før* det sendes til systemets logger (`utils/logger.js`).
- **Gennemsigtighed:** Hele objektet/teksten skal altid sendes råt til loggeren. Hvis vi begrænser data 100-vis af steder i koden, mister vi muligheden for nogensinde at se det fulde output ved fejlsøgning.
- **Single Point of Control:** Filtrering og trunkering må **KUN** ske centralt i `utils/logger.js`. Her styres visningen dynamisk baseret på verbose-niveau:
  - `(tom)`: Viser kun overordnede status-beskeder.
  - `-v`: Viser et kort resumé af data (typisk 500 tegn).
  - `-vv`: Viser den **FULDE** rå data uden nogen form for begrænsning.
- **Konklusion:** Hvis du ikke kan se hele AI-svaret, skal du ændre dit verbose-flag, **IKKE** ændre koden. Ved at overholde dette princip kan vi rette log-adfærd ét centralt sted frem for 117 steder i koden.

### 2. Standardiseret AI-Abstraktion & Data-kontrakt (Afkobling)
For at holde koden ren og minimal, skal vi altid tilstræbe fuld afkobling mellem AI-logik og resten af systemet (især Frontend):
- **AI-laget som "Oversætter":** Backenden (specifikt `AiManager` og de enkelte providers) har ansvaret for at tage råt og ofte "støjende" output fra forskellige AI-modeller og transformere det til et fast, sundt JSON-format.
- **Frontend-uafhængighed:** Frontend (FE) må aldrig kende til de specifikke detaljer om hvilken AI-model eller provider, der er brugt. FE skal blot modtage data i det aftalte format. Dette sikrer, at vi kan skifte eller tilføje nye AI-modeller uden at skulle rette én eneste linje i frontend-koden.
- **Minimalisme:** Ved at placere oversættelseslogikken centralt i AI-laget, undgår vi at "forurene" resten af forretningslogikken med særregler for specifikke AI-udbydere.
- **Konklusion:** "Sund data ind, sund data ud". Hvis en AI-model svarer skævt, rettes det i AI-lagets transformering – aldrig i modtager-enden (FE).

### 3. Fuld Sporbarhed (Traceability) - Inputs & Outputs
For at eliminere "black boxes" i systemet skal vi altid kunne se datastrømmen:
- **Input Logging:** Alle vigtige funktioner skal logge deres indgangsparametre (`args`) som det første, når de kaldes.
- **Output Logging:** Før en funktion returnerer, skal den logge resultatet (`return value`).
- **Variadic Logging:** Brug systemets variadic logger (`logger.info(func, msg, ...data)`) til at sende flere argumenter på én gang (f.eks. `logger.info("minFunktion", "Kaldt med:", { arg1, arg2 })`).
- **Konklusion:** En log uden data er kun en halv log. Vi skal altid kunne rekonstruere et hændelsesforløb blot ved at kigge på loggen.

### 4. Eksekvering & Test
- **ALT** skal køres via Docker. Dette inkluderer tests, database-migreringer og selve applikationen.
- Brug altid `docker compose` til at styre miljøet.
- Backend tests: `docker exec jaa-backend npm test`.
- Frontend tests: `docker exec jaa-frontend npm test`.
- Dette sikrer, at vi altid arbejder i et identisk og isoleret miljø.

## 🌐 Infrastruktur & Netværk (Låste Standarder)

### 1. Single Source of Truth (Ports & URL's)
- **INGEN** magiske portnumre i koden eller scripts.
- Alle porte skal defineres centralt (typisk i `.env` eller en master-variabel i scripts).
- Hvis et script (f.eks. `test_api.sh`) bruger en port, skal den læses fra en variabel i toppen af filen, så den kun skal rettes ét sted.

### 2. Porte (Port Mapping)
Disse værdier er master-standarderne:
- **Frontend (React):** Port `3000` (Variable: `FRONTEND_PORT`)
- **Backend (Node.js):** Port `3002` (Variable: `BACKEND_PORT`)
- **Redis:** Port `6379` (Variable: `REDIS_PORT`)


### 2. Containernavne (Docker)
For at sikre konsistens på tværs af instanser bruges altid disse navne:
- **Frontend:** `jaa-frontend`
- **Backend:** `jaa-backend`
- **Redis:** `jaa-redis`

*Bemærk: Da mappen `mgn` og `template` deler disse navne, må de aldrig køre samtidigt (husk `docker compose down`).*

## 🌍 Portabilitet & Miljø-isolering (Zero Host Dependency)

### 1. Ingen hårde Host-stier
- Der må **ALDRIG** bruges absolutte stier til din lokale profil i konfigurationsfiler (f.eks. `/home/mgn/` eller `C:\Users\`).
- Docker volumes skal være relative til projektmappen (f.eks. `./backend:/app`).

### 2. Ingen Hardcoding af Personlig Data
- Der må **ALDRIG** hardkodes navne, initialer, adresser eller andre personhenførbare data direkte i koden eller frontend-komponenter.
- Alle personlige oplysninger SKAL udledes dynamisk fra Master CV (`brutto_cv.md`) eller konfigureres via miljøvariabler (`.env`).
- Dette sikrer, at systemet er template-venligt og kan bruges af andre blot ved at udskifte data-filerne.

### 3. Konfiguration via Miljøvariabler (.env)
- **Single Source of Truth:** Der bruges kun ÉN `.env` fil placeret i projektets rodmappe. Tidligere filer som `.env_ai` er udfaset.
- **Minimalisme:** Kun variable data (API nøgler, porte, miljø-specifikke navne) må ligge i `.env`. 
- **Template:** Der skal altid findes en `.env_template` med tomme værdier eller standardværdier, som er checket ind i Git.
- Systemet skal kunne startes på en "frisk" maskine ved blot at kopiere `.env_template` til `.env` og indsætte nøgler.

### 3. Auto-Dokumenterende Infrastruktur
- **JSDoc på Startup:** Teknisk dokumentation (`docs/code/`) genereres automatisk af Docker-containeren ved hver opstart.
- **Ingen Værktøjs-afhængighed:** Brugeren må ikke være afhængig af lokale installationer af dokumentationsværktøjer (npm, jsdoc). Alt skal køre inde i Docker.

## 💾 Git Konventioner

### 1. Commits
- Commit-beskeder skal være på dansk og starte med et sigende præfiks (f.eks. `feat:`, `fix:`, `docs:`, `refactor:`).
- Eksempel: `docs: indfører arkitektoniske kodestandarder og versionsstyring`.

### 2. Tags
- Brug formatet `v[VERSION]-[beskrivelse]` i små bogstaver (kebab-case).
- Tags bruges til at markere vigtige milepæle eller tilstande før store ændringer.
- Eksempel: `v5.6.0-before-refactor`.

---
*Sidst opdateret: 7. april 2026 (v5.6.8)*
