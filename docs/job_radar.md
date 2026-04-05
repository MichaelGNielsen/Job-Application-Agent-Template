# Job Radar - Proaktiv Jobsøgning

Job Radaren er systemets "tidlige varslingssystem". Den overvåger markedet og dine egne fundne links for at sikre, at du altid har de mest relevante åbninger klar til behandling.

## 🎯 Kernefunktionalitet

### 1. Manuel Tilføjelse (Nyt i v5.1.0)
Du kan nu smide et direkte link (LinkedIn, JobIndex, firma-hjemmeside etc.) ind i radaren.
- **AI-Analyse:** Systemet besøger linket og udtrækker automatisk jobtitel og firmanavn via Gemini.
- **Instant Match-Score:** Jobbet bliver med det samme holdt op mod dit `brutto_cv.md`, og du får en score (0-100%) samt de to vigtigste grunde til matchet.

### 2. Automatisk Link-Validering (v5.1.0)
Med "🧹 Vask Liste" funktionen sikrer systemet, at din radar altid er "skarp":
- **Health Check:** Hvert link i listen bliver pinget for at tjekke, om jobopslaget stadig er aktivt (tjekker for 404-fejl).
- **Udløbsstyring:** Jobs, der har passeret deres udløbsdato eller er blevet fjernet fra kilden, bliver automatisk sorteret fra.

### 3. Proaktiv Søgning
Når du trykker på "🚀 Søg efter nye job", sker følgende:
- **Kontekstuel Analyse:** Gemini analyserer dit CV og finder de 3 vigtigste tekniske kompetencer.
- **Targeted Search:** Der foretages en målrettet søgning på tværs af jobportaler (primært JobIndex) baseret på din valgte **Hjemby** og **Radius**.
- **Kvalitetsfilter:** Kun de jobs, der får en høj match-score, bliver føjet til listen.

## ⚙️ Konfiguration
Indstillingerne gemmes i `data/radar.json`:
- **Hjemby:** Den by, systemet beregner afstand (KM) fra.
- **Radius:** Maksimal afstand du er villig til at køre/pendle.

## 🛠️ Tekniske Endpoints
- `GET /api/radar`: Henter den aktuelle liste.
- `POST /api/radar/job`: Tilføjer et link manuelt (med AI-metadata).
- `POST /api/radar/maintenance`: Renser listen for døde links.
- `POST /api/radar/refresh`: Starter en proaktiv søgning.

---
*Sidst opdateret: 3. april 2026 (v5.1.0)*
