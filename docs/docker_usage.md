<!--
  Job Application Agent Template
  Designer: MGN (mgn@mgnielsen.dk)
  Copyright (c) 2026 MGN. All rights reserved.
  BEMÆRK: Denne kode anvender AI til generering og behandling.
  Brugeren skal selv verificere, at resultatet er som forventet.
  Softwaren leveres "som den er", uden nogen form for garanti.
  Brug af softwaren sker på eget ansvar.
-->

# Docker & WSL Driftvejledning

Dette dokument beskriver, hvordan du håndterer Docker-miljøet og hvad du gør, hvis WSL (Windows Subsystem for Linux) driller eller smider dig ud.

## 🐳 Docker Kommandoer

> **⚠️ Navne-konflikter:** Da `MGN` og `Template` versionerne nu deler containernavne (`jaa-backend`, `jaa-frontend`, `jaa-redis`), skal du altid stoppe den ene før du starter den anden med `docker compose down`.

Når du har lavet ændringer i koden eller Dockerfile, skal containerne genopbygges:

```bash
## Standard genopbygning (bruger cache hvis muligt)
docker compose up --build -d

## FORCE REBUILD (Hvis du vil ignorere cache og bygge alt forfra)
docker compose build --no-cache
docker compose up --force-recreate -d

## Stop og fjern alt (Rydder også netværk)
docker compose down

```

## Se logs fra backenden (hvis noget fejler)

```bash
docker compose logs -f backend

```

## Se status på alle containere

```bash
docker compose ps

```

## 🛠 WSL Fejlhåndtering (Kør disse i PowerShell på Windows)

Hvis WSL fryser, eller du bliver smidt ud ("Connection lost"), skal du bruge disse kommandoer i en **PowerShell** (tryk Win+X og vælg Terminal/PowerShell):

### 1. Se hvad der kører

Dette viser status på dine Linux-distributioner.

```powershell
wsl --list --verbose

```

### 2. Genstart hele WSL (The "Nuke" Option)

Dette lukker ALLE Linux-instanser og Docker Desktop. Det er den mest effektive måde at fikse "I/O error" eller "Timeout" fejl på.

```powershell
wsl --shutdown

```

Efter dette skal du blot åbne din Ubuntu-terminal igen og starte Docker Desktop.

### 3. Luk kun den specifikke instans

Hvis du kun vil genstarte Ubuntu uden at lukke alt andet:

```powershell
wsl --terminate Ubuntu

```

### 4. Hvis WSL slet ikke vil starte

Prøv at tjekke om "Windows Subsystem for Linux" servicen kører, eller genstart din computer. Ofte skyldes det, at Windows har opdateret noget i baggrunden.

---

## 🚀 Version Info
Systemets aktuelle version kan altid findes i filen `VERSION` i rodmappen eller i toppen af `README.md`.
