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
        const cmd = `chromium-browser --headless --disable-gpu --no-sandbox --no-pdf-header-footer --print-to-pdf="${outputPath}" "${url}"`;
        await execPromise(cmd);
        return true;
    } catch (error) {
        logger.error("scraper", "Fejl ved arkivering af jobopslag", { url }, error);
        return false;
    }
}

module.exports = saveUrlToPdf;
