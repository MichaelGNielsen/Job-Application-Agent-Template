const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const execPromise = promisify(exec);

/**
 * Sender en prompt til Gemini CLI.
 * Kø-håndtering styres nu centralt af AiManager via BullMQ.
 * @param {string} prompt 
 * @param {string} jobId 
 * @returns {Promise<string>}
 */
async function callLocalGemini(prompt, jobId = "default") {
    const startTime = Date.now();
    try {
        const tempFile = path.join('/tmp', `prompt_${jobId}_${Date.now()}.txt`);
        fs.writeFileSync(tempFile, prompt);
        
        const modelName = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
        logger.info("callLocalGemini", `Sender prompt til Gemini CLI (Job: ${jobId}, Model: ${modelName})`, { tegn: prompt.length });

        // Vi tilføjer -y for YOLO mode (auto-approve)
        const { stdout } = await execPromise(`gemini -y --model ${modelName} < "${tempFile}"`, { maxBuffer: 1024 * 1024 * 50 });
        
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        logger.info("callLocalGemini", `AI Respons modtaget på ${duration} sekunder`, { svarLængde: stdout.length });
        
        return stdout;
    } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        logger.error("callLocalGemini", `Fejl ved kald efter ${duration} sekunder`, { error: error.message });
        throw error;
    }
}

module.exports = callLocalGemini;
