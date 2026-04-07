# Den Strategiske Pipeline (Arkitektur v6.0.0+)

Dette dokument beskriver den underliggende AI-arkitektur for Job Application Agenten, specifikt hvordan systemet opdeler og orkestrerer genereringen af ansøgningsmateriale for at sikre maksimal kvalitet, konsistens og en stærk "rød tråd".

## Udfordringen med "One-Shot" Generering
Tidligere versioner af systemet bad AI'en om at generere alle dokumenter (Ansøgning, CV, Match Analyse, ICAN+ Pitch) i ét stort kald. Dette førte til flere problemer:
1. **Token-forstoppelse:** Store prompts med komplekse instruktioner og store mængder kildetekst udmatter LLM'ens kontekstvindue, hvilket forringer kvaliteten af outputtet.
2. **Manglende "Rød Tråd":** Når AI'en skriver ansøgningen og CV'et samtidigt, kan den risikere at fremhæve kompetencer i ansøgningen, som den derefter glemmer at inkludere i det målrettede CV.
3. **Format-forvirring:** At bede AI'en om at overholde 4 forskellige formater og returnere dem med specifikke mærkater i ét svar fører ofte til formateringsfejl og overskrevne metadata.

## Løsningen: Chain of Thought (CoT) og Context Chaining
For at løse dette, anvender systemet en 4-trins sekventiel pipeline. Hvert trin bygger på resultatet af det foregående, hvilket tvinger AI'en til at lægge en strategi (*Chain of Thought*) før den eksekverer.

### Trin 1: Match Analysen (Hjernen & Strategien)
*   **Input:** Brutto-CV + Jobopslag.
*   **Opgaven:** Analyser jobbet grundigt. Hvad er de 3 vigtigste krav? Hvor dækker ansøgeren dem perfekt (med beviser fra CV'et)? Hvor er ansøgeren svag, og hvordan tackler vi det bedst?
*   **Formål:** Dette trin tvinger AI'en til at lave sit benarbejde. Den fastlægger "vinklen" og den overordnede salgsstrategi for hele ansøgningspakken.

### Trin 2: Det Målrettede CV (Fundamentet)
*   **Input:** Brutto-CV + Jobopslag + **Match Analysen (fra Trin 1)**.
*   **Opgaven:** Kog Brutto-CV'et ned til et skarpt, målrettet CV. Fremhæv præcis de erfaringer, vi identificerede som afgørende i Match Analysen. Fjern irrelevant støj.
*   **Formål:** CV'et skal være faktuelt og fundamentet for ansøgningen. Ved at skrive det nu, baseret på strategien, sikrer vi, at de ting, vi vil prale af i ansøgningen, faktisk står tydeligt i CV'et.

### Trin 3: Ansøgningen (Salget)
*   **Input:** Jobopslag + **Det Målrettede CV (fra Trin 2)** + **Match Analysen (fra Trin 1)**.
*   **Opgaven:** Skriv ansøgningen med udgangspunkt i vinklen fra Match Analysen. Ansøgningen må *kun* henvise til erfaringer og resultater, der rent faktisk er med i Det Målrettede CV.
*   **Formål:** Dette løser det klassiske AI-problem med hallucinationer eller uoverensstemmelser. Ved at give AI'en det færdige CV som streng kilde, bliver ansøgningen 100% synkroniseret med CV'et.

### Trin 4: ICAN+ Pitch (Jobsamtale-forberedelsen)
*   **Input:** Jobopslag + **Ansøgningen (fra Trin 3)** + **Det Målrettede CV (fra Trin 2)**.
*   **Opgaven:** Kog hele fortællingen (fra ansøgning og CV) ned til skarpe, mundtlige samtalepointer ud fra ICAN-frameworket (Interest, Credentials, Accomplishments, Next steps).
*   **Formål:** ICAN+ er essensen af hele pakken. Den opsummerer det salgsarbejde, de andre dokumenter har gjort, og gør ansøgeren klar til samtalen.

## Fordele ved Pipelinen
1.  **Ekstrem Konsistens:** Den røde tråd er garanteret. Hvis Match Analysen (Trin 1) beslutter, at en specifik teknisk erfaring er vigtigst, vil Trin 2 gøre den tydelig i CV'et, Trin 3 vil bruge den som krog i ansøgningen, og Trin 4 vil gøre det til hovedargumentet til samtalen.
2.  **Mindre Hallucination:** Jo mere specifik og begrænset kontekst AI'en får i de sene trin (Trin 3 og 4), jo mindre finder den på af sig selv.
3.  **Højere Kvalitet:** Isolerede prompts tillader mere detaljerede instruktioner per dokumenttype.
4.  **Kirurgisk Forfinelse (Refine):** Hvis brugeren senere beder om at få forfinet ansøgningen ("Gør den kortere"), kan systemet blot køre Trin 3 igen med det nye hint, velvidende at CV'et (Trin 2) og strategien (Trin 1) forbliver intakt som fundament.

*Selvom denne sekventielle tilgang tager lidt længere tid (da jobbene venter på hinanden), opvejes dette massivt af det professionelle og gennemtænkte slutresultat.*
