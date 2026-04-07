# AI Guide: Ollama (Local LLM)

Ollama giver dig mulighed for at køre open-source modeller som Llama 3, Mistral og Gemma direkte på din egen maskine (lokalt).

## 🚀 Opsætning & Forbindelse

Ollama kører som en lokal HTTP-tjeneste på port **11434**.

- **URL:** `http://localhost:11434`
- **Container:** `ollama-server`

## 🛠 Test via CURL

Du kan teste din lokale Ollama-installation direkte fra terminalen:

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Hvad er 2+2? Svar kun med tallet.",
  "stream": false 
}'
```

### Valg af model
Sørg for, at modellen (f.eks. `llama3.2`) er downloadet før brug:
```bash
docker exec -it ollama-standalone ollama pull llama3.2
```

## 🧠 Optimering for Lokale Modeller

- **CPU vs. GPU:** Ollama vil automatisk bruge din GPU hvis den er tilgængelig og understøttet (via NVIDIA Container Toolkit).
- **Fallback:** Ollama fungerer som det sidste led i systemets AI-fallback kæde (Gemini -> OpenCode -> Ollama).

---
*Sidst opdateret: 7. april 2026*
