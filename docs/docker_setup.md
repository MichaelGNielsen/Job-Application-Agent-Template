<!--
  Job Application Agent Template
  Designer: MGN (mgn@mgnielsen.dk)
  Copyright (c) 2026 MGN. All rights reserved.
  BEMÆRK: Denne kode anvender AI til generering og behandling.
  Brugeren skal selv verificere, at resultatet er som forventet.
  Softwaren leveres "som den er", uden nogen form for garanti.
  Brug af softwaren sker på eget ansvar.
-->

# Docker Opsætning: Job Application Agent MGN

Dette dokument beskriver, hvordan vi containeriserer applikationen for at gøre den bærbar og stabil.

## Container Oversigt

| Container | Image | Formål |
| :--- | :--- | :--- |
| **Frontend** | Node (Alpine) | Serverer React/Vite appen via Nginx eller Vite preview. |
| **Backend** | Node (Debian) | Kører Express API, Socket.io og Gemini CLI. |
| **Redis** | Redis (Alpine) | Fungerer som Message Broker for BullMQ køen. |

## Netværksflow (Guldstandarden)

1. **Frontend** sender opgave til **Backend** via Socket.io/REST.
2. **Backend** tilføjer opgave til **Redis** køen.
3. **Worker** (inde i Backend containeren) snupper opgaven fra **Redis**.
4. **Worker** kører Gemini CLI og gemmer filer i en "Shared Volume".
5. **Worker** sender status "Færdig" tilbage til **Frontend**.

## Docker Compose Struktur

```yaml
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    volumes:
      - .:/app/shared # Giver adgang til dine job-mapper
      - ~/.gemini:/root/.gemini # Mapper din lokale Gemini konfiguration ind
    environment:
      - REDIS_HOST=redis
    depends_on:
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

```

## GitHub Overvejelser

* Vi inkluderer en `.env.example`.
* Vi bruger `.dockerignore` for at undgå at sende `node_modules` ind i containerne.
* Dokumentationen i `docs/` gør det nemt for nye brugere at forstå flowet.
