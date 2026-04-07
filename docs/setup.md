# Setup Guide: Job Application Agent MGN (v6.0.0)

Denne guide hjælper dig med at sætte din personlige Job Application Agent op fra bunden.

## 1. Identitet & Konfiguration (.env)
Alt hvad der gør agenten til "din", bor i filen `.env`. 

1.  Kopiér filen `.env_template` til en ny fil med navnet `.env`.
2.  Indsæt din Google Gemini API nøgle ved `GEMINI_API_KEY=`.
3.  (Valgfrit) Ret porte eller AI-præferencer i filen.

## 2. Din Erfaring (Master CV)
Agenten har brug for at kende din baggrund for at kunne skrive dine ansøgninger.

1.  Gå til mappen `data/`.
2.  Åbn `brutto_cv.md`.
3.  Erstat indholdet med din egen erhvervserfaring, kurser og profil. 
    -   *Tip:* Sørg for at stamdata (navn, adresse, etc.) i toppen af filen er korrekte, da systemet bruger dem i ansøgnings-layoutet.

## 3. Start Agenten med Docker
Systemet er fuldt containeriseret for at sikre stabilitet.

1.  Åbn din terminal i projektets rodmappe.
2.  Kør kommandoen: `docker compose up -d --build`
3.  Åbn din browser på: **http://localhost:3000** (Frontend)
4.  Backend og Swagger findes på: **http://localhost:3002/api-docs**

## 4. AI-Servere (Valgfrit)
Hvis du vil bruge lokale modeller (OpenCode/Ollama), skal de startes separat:
1. Gå til rodmappen i dit workspace.
2. Kør `./start_ai_servers.sh` (kræver at du har clonet `opencode-server` og `ollama-server`).

## 5. Fejlfinding & Logs
Hvis noget ikke virker:
- Tjek logs: `docker compose logs -f backend`
- Kør AI test: `http://localhost:3002/api/ai/test?provider=gemini`
- Se **[docker_usage.md](docker_usage.md)** for WSL-specifik hjælp.

---
*God jagt på drømmejobbet! 🚀*
