# 🛠️ Job-Application-Agent Debug & Usage Guide

Her er de vigtigste "guldkorn" til at styre og debugge systemet direkte fra terminalen.

## 🔍 System Tjek

Tjek hvilken version der rent faktisk kører i backenden:

```bash
curl -s http://localhost:9001/api/version

```

Tjek om Redis er oppe og svarer (kræver redis-cli lokalt):

```bash
redis-cli -p 6379 ping
## Svarer: PONG

```

## 📄 Data Adgang

Hent det nuværende Master CV (Brutto CV):

```bash
curl -s http://localhost:9001/api/brutto | jq -r .content

```

## 🚀 Manuel Styring

Trigger en ny generering uden at bruge web-interfacet (nyttigt til scripting):

```bash
curl -X POST http://localhost:9001/api/generate \
-H "Content-Type: application/json" \
-d '{
  "jobText": "Indsæt jobtekst her...",
  "companyUrl": "https://firma.dk",
  "hint": "Husk at nævne mine AI projekter"
}'

```

## 📂 Output Management

Se alle genererede mapper:

```bash
ls -td output/*/

```

Ryd op i gamle kørsel-data (forsigtig!):

```bash
## Slet alle mapper i output undtagen de nyeste 5
ls -td output/*/ | tail -n +6 | xargs rm -rf

```

---

*Sidst opdateret: 15. marts 2026 (2.7.0)*
