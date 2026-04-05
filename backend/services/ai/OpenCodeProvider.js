/**
 * OpenCodeProvider.js
 * AI Provider til OpenCode Server API.
 * Bruger det nyligt opdagede session-baserede API.
 */

class OpenCodeProvider {
    constructor(deps) {
        this.logger = deps.logger;
        this.baseUrl = process.env.OPENCODE_URL || "http://localhost:4096";
    }

    async call(prompt, jobId = "default") {
        this.logger.info("OpenCodeProvider", `Starter OpenCode session`, { url: this.baseUrl, tegn: prompt.length });
        
        try {
            // 1. Opret en session
            const sessionRes = await fetch(`${this.baseUrl}/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            if (!sessionRes.ok) {
                const errText = await sessionRes.text();
                throw new Error(`Fejl ved oprettelse af OpenCode session: ${sessionRes.status} - ${errText}`);
            }

            const sessionData = await sessionRes.json();
            const sessionId = sessionData.id;

            this.logger.info("OpenCodeProvider", `Sender besked til OpenCode session (${sessionId})`);

            // 2. Send besked til sessionen
            const messageRes = await fetch(`${this.baseUrl}/session/${sessionId}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    parts: [{ type: "text", text: prompt }]
                })
            });

            if (!messageRes.ok) {
                const errText = await messageRes.text();
                throw new Error(`Fejl ved afsendelse af besked til OpenCode: ${messageRes.status} - ${errText}`);
            }
            
            const data = await messageRes.json();
            
            // Find tekst-delen af svaret i parts-arrayet
            let answer = "";
            if (data.parts && Array.isArray(data.parts)) {
                const textPart = data.parts.find(p => p.type === 'text');
                if (textPart && textPart.text) {
                    answer = textPart.text;
                }
            }

            return answer || JSON.stringify(data);
        } catch (error) {
            this.logger.error("OpenCodeProvider", "Kald til OpenCode Server fejlede", { error: error.message });
            throw error;
        }
    }
}

module.exports = OpenCodeProvider;
