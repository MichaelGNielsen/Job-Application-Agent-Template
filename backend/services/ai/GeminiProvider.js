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
            this.logger.info("GeminiProvider", `Sender til Google Gemini (${modelToUse})`, { tegn: prompt.length });

            // Bruger konfigurerbar buffer fra .env
            let { stdout } = await execPromise(`gemini -y --model ${modelToUse} < "${tempFile}"`, { 
                maxBuffer: this.maxBuffer 
            });
            
            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);

            // Filtrer log-støj fra Gemini CLI (ClearcutLogger osv.)
            stdout = stdout.split('\n')
                .filter(line => !line.includes('ClearcutLogger:') && !line.includes('marking pending flush'))
                .join('\n')
                .trim();

            return stdout;
        } catch (error) {
            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            throw error;
        }
    }
}

module.exports = GeminiProvider;
