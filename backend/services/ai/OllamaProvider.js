/**
 * OllamaProvider.js
 * AI Provider til lokal Ollama API.
 */

class OllamaProvider {
    constructor(deps) {
        this.logger = deps.logger;
        this.baseUrl = deps.baseUrl || process.env.OLLAMA_URL || "http://localhost:11434";
        this.model = deps.model || process.env.OLLAMA_MODEL || "llama3.2:3b";
    }

    async call(prompt, jobId = "default", aiModel = null) {
        const startTime = Date.now();
        const modelToUse = aiModel || this.model;
        this.logger.info("OllamaProvider", `Sender til Ollama (${modelToUse})`, { url: this.baseUrl, tegn: prompt.length, prompt });
        
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: modelToUse,
                    prompt: prompt,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ollama HTTP fejl: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            const duration = Date.now() - startTime;
            this.logger.info("OllamaProvider", `Rå svar modtaget fra Ollama`, { durationMs: duration, rawResponse: data });
            
            // Ollama returnerer { model: "...", created_at: "...", response: "SVAR", ... }
            return data.response || data.text || JSON.stringify(data);
        } catch (error) {
            this.logger.error("OllamaProvider", "Kald til Ollama fejlede", { error: error.message });
            throw error;
        }
    }
}

module.exports = OllamaProvider;
