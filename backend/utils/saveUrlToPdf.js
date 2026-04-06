const { exec } = require('child_process');
const { promisify } = require('util');
const logger = require('./logger');

const execPromise = promisify(exec);

/**
 * Gemmer en URL direkte som en PDF (arkivering af jobopslag).
 * @param {string} url 
 * @param {string} outputPath 
 * @returns {Promise<boolean>}
 */
async function saveUrlToPdf(url, outputPath) {
    try {
        logger.info("scraper", "Arkiverer jobopslag som PDF", { url, outputPath });
        // Vi tilføjer --virtual-time-budget for at give JS tid til at loade indholdet
        // Vi tilføjer en hård timeout på 30 sekunder for at undgå at processen hænger
        const cmd = `chromium-browser --headless --disable-gpu --no-sandbox --no-pdf-header-footer --virtual-time-budget=5000 --print-to-pdf="${outputPath}" "${url}"`;
        await execPromise(cmd, {
            timeout: 30000,
            killSignal: 'SIGKILL'
        });
        return true;
    } catch (error) {
        logger.error("scraper", "Fejl ved arkivering af jobopslag", { url }, error);
        return false;
    }
}

module.exports = saveUrlToPdf;
