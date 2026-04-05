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
    }

    async call(prompt, jobId = "default") {
        const startTime = Date.now();
        const tempFile = path.join('/tmp', `prompt_${jobId}_${Date.now()}.txt`);
        
        try {
            fs.writeFileSync(tempFile, prompt);
            this.logger.info("GeminiProvider", `Sender til Google Gemini (${this.model})`, { tegn: prompt.length });

            const { stdout } = await execPromise(`gemini -y --model ${this.model} < "${tempFile}"`, { maxBuffer: 1024 * 1024 * 50 });
            
            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            return stdout;
        } catch (error) {
            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            throw error;
        }
    }
}

module.exports = GeminiProvider;
