# 🎨 MGN Design System - Layout Kontrakt

Dette dokument definerer de visuelle rammer for Job Application Agent MGN. Ingen radikale ændringer må foretages uden eksplicit godkendelse.

## 🌈 Farvepalette & Tema
- **Baggrund:** Deep Black (`#050505`) med subtile gradients.
- **Accent:** Cyan (`cyan-500/600`) bruges til interaktive elementer og status.
- **Tekst:** Gray-300 for læsbarhed, White for titler.
- **Karakter:** "Cyberpunk Professional" - rent, mørkt og højteknologisk.

## 🌀 Visuelle Signaturer
- **Loading:** SKAL altid være en "Drebin Spinner" (Spejlet spiral `scaleX(-1)` der roterer visuelt med uret).
- **Header:** Skal altid indeholde logo, Version (fra `VERSION` filen) og den aktive AI-model ("AI Brain").
- **Kort:** Dokumenter vises i kort med glaseffekt (`backdrop-blur`) og subtile rammer (`border-white/10`).

## 🏗️ Struktur & Navigation
- **Top-tabs:** Til skift mellem Generering, Master CV og Konfiguration.
- **Hoved-Inputs:** SKAL altid være vertikalt stakket (ovenpå hinanden) for at sikre visuel stabilitet og undgå at elementer hopper rundt ved resize.
- **Dokument-visning:** Skal altid have tre modes: Preview (HTML), Ret Indhold (Ren Markdown) og Metadata (YAML).
- **Atomic Mode:** Editoren må aldrig indeholde tekniske tags eller metadata - kun den rene tekst.

---
*Denne kontrakt er gældende fra v4.7.2.*
