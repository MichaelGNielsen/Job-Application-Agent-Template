/**
 * GeminiProvider.js
 * AI Provider til Google Gemini (via Gemini CLI).
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const execPromise = promisify(exec);

class GeminiProvider {
    constructor(deps) {
        this.logger = deps.logger;
        this.model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
        this.maxBuffer = (parseInt(process.env.GEMINI_MAX_BUFFER_MB) || 100) * 1024 * 1024;
    }

    async call(prompt, jobId = "default", aiModel = null) {
        const startTime = Date.now();
        const tempFile = path.join('/tmp', `prompt_${jobId}_${Date.now()}.txt`);
        const modelToUse = aiModel || this.model;
        
        try {
            fs.writeFileSync(tempFile, prompt);
            this.logger.info("GeminiProvider", `Sender til Google Gemini (${modelToUse})`, { tegn: prompt.length, prompt });

            // Tjek om vi skal bruge en alternativ API nøgle fra præferencer
            let envVars = { ...process.env, maxBuffer: this.maxBuffer };
            try {
                const prefsPath = path.join(process.cwd(), 'data', 'ai_preferences.json');
                if (fs.existsSync(prefsPath)) {
                    const prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
                    const customKey = prefs.providers?.gemini?.apiKey;
                    if (customKey && customKey.length > 20 && !customKey.includes('DIN_API_NØGLE')) {
                        envVars.GOOGLE_API_KEY = customKey;
                        envVars.GEMINI_API_KEY = customKey;
                        this.logger.info("GeminiProvider", "Bruger API-nøgle fra ai_preferences.json");
                    }
                }
            } catch (e) {
                this.logger.warn("GeminiProvider", "Kunne ikke læse API-nøgle fra præferencer", { error: e.message });
            }

            // Bruger konfigurerbar buffer fra .env
            let { stdout } = await execPromise(`gemini -y --model ${modelToUse} < "${tempFile}"`, { 
                maxBuffer: this.maxBuffer,
                env: envVars
            });
            
            const duration = Date.now() - startTime;
            this.logger.info("GeminiProvider", `Rå svar modtaget fra Google Gemini`, { durationMs: duration, rawStdout: stdout });

            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);

            // Filtrer log-støj fra Gemini CLI (ClearcutLogger osv.)
            let cleanedOutput = stdout.split('\n')
                .filter(line => !line.includes('ClearcutLogger:') && !line.includes('marking pending flush'))
                .join('\n')
                .trim();

            this.logger.info("GeminiProvider", `Filtreret svar klar`, { cleanedOutput });

            return cleanedOutput;
        } catch (error) {
            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            this.logger.error("GeminiProvider", "Google Gemini kald fejlede", error);
            throw error;
        }
    }
}

module.exports = GeminiProvider;
