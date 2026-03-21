# GDPR Compliance: Vejen til Produktion (v2.7.0)

Dette dokument ridser de nødvendige skridt op for at gøre Job-Application-Agent klar til brug med rigtige person-data i en organisation som AKA eller Jobnet.

## 1. Privat AI-Infrastruktur

Den nuværende brug af offentlig Gemini API er KUN til demo. Ved rigtige person-data skal en af følgende to løsninger implementeres:

* **Lokal LLM (On-Premise):** Kørsel af f.eks. Llama 3 via Ollama på organisationens egne servere. Data forlader aldrig eget netværk.
* **Enterprise Cloud (EU):** Brug af Azure OpenAI eller Google Vertex AI i en EU-region (f.eks. Belgien eller Tyskland) med en juridisk bindende databehandleraftale (DPA).

## 2. Zero-Retention Politik

Organisationen skal sikre, at AI-udbyderen garanterer:

* At prompts og person-data ikke gemmes til træning af AI-modeller.
* At alle data slettes fra AI-motorens midlertidige hukommelse umiddelbart efter generering.

## 3. Datastyring & Sletning

Systemet skal udvides med funktioner til at overholde "Retten til at blive glemt":

* **Auto-Cleanup:** Automatisk sletning af alt output i `/output/` efter endt session eller 24 timer.
* **Bruger-styret sletning:** En "Slet mine data" knap, der tømmer `brutto_cv.md` og alle genererede dokumenter permanent.

## 4. Sikker Transmission

Al kommunikation skal sikres:

* **HTTPS/TLS:** Implementering af SSL-certifikater på tværs af frontend og backend.
* **Adgangsstyring:** Integration med organisationens interne login-system (SSO/AD) for at sikre, at kun autoriserede sagsbehandlere eller borgere har adgang.

---

**Konklusion:** Arkitekturen er klar, men motoren skal skiftes. Ved at bruge organisationens interne AI-service bliver systemet 100% GDPR-compliant.
