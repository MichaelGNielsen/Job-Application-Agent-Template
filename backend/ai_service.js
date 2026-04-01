const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

/**
 * AI Service (v4.8.0)
 * Håndterer kommunikation med Gemini CLI.
 */
async function callLocalGemini(prompt, jobId = "default", logger, retries = 3) {
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    
    for (let i = 0; i < retries; i++) {
        const tempFile = path.join('/tmp', `prompt_${jobId}_${Date.now()}_${i}.txt`);
        try {
            fs.writeFileSync(tempFile, prompt);
            const cmd = `gemini -m "${model}" -y < "${tempFile}"`;
            
            if (logger) logger.info("ai_service", `Sender prompt til Gemini (Job: ${jobId}, Forsøg: ${i+1}/${retries})`, { tegn: prompt.length });
            
            const { stdout } = await execPromise(cmd);
            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            return stdout;
        } catch (error) {
            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            if (logger) logger.warn("ai_service", `Fejl ved Gemini kald (Forsøg ${i+1})`, { error: error.message });
            
            if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                continue;
            }
            throw error;
        }
    }
}

module.exports = { callLocalGemini };
