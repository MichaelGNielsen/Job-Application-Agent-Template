const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const execPromise = promisify(exec);

/**
 * Konverterer en HTML fil til PDF via headless Chromium.
 * @param {string} htmlPath 
 * @param {string} pdfPath 
 * @returns {Promise<boolean>}
 */
async function printToPdf(htmlPath, pdfPath) {
    const tempSafeHtml = path.join(path.dirname(htmlPath), `print_tmp_${Date.now()}.html`);
    try {
        fs.copyFileSync(htmlPath, tempSafeHtml);
        const cmd = `chromium-browser --headless --disable-gpu --no-sandbox --no-pdf-header-footer --print-to-pdf="${pdfPath}" "file://${tempSafeHtml}"`;
        logger.info("printToPdf", "Genererer PDF", { cmd });
        await execPromise(cmd);
        if (fs.existsSync(tempSafeHtml)) fs.unlinkSync(tempSafeHtml);
        return true;
    } catch (error) {
        if (fs.existsSync(tempSafeHtml)) fs.unlinkSync(tempSafeHtml);
        logger.error("printToPdf", "PDF-generering fejlede", { htmlPath, pdfPath }, error);
        return false;
    }
}

module.exports = printToPdf;
