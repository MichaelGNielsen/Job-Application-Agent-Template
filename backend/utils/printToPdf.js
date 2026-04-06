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
    // 1. Validering af sti
    if (!htmlPath || typeof htmlPath !== 'string' || !fs.existsSync(htmlPath)) {
        logger.error("printToPdf", "Ugyldig eller manglende htmlPath", { htmlPath });
        return false;
    }

    const tempSafeHtml = path.join(path.dirname(htmlPath), `print_tmp_${Date.now()}_${Math.floor(Math.random() * 1000)}.html`);
    
    try {
        // 2. Sikker kopiering af fil
        fs.copyFileSync(htmlPath, tempSafeHtml);
        
        // 3. Command construction
        const cmd = `chromium-browser --headless --disable-gpu --no-sandbox --no-pdf-header-footer --print-to-pdf="${pdfPath}" "file://${tempSafeHtml}"`;
        logger.info("printToPdf", "Genererer PDF", { cmd });
        
        // 4. Udførelse med timeout-beskyttelse
        await execPromise(cmd);

        // 5. Verificer at PDF'en blev skabt
        if (fs.existsSync(pdfPath) && fs.statSync(pdfPath).size > 0) {
            if (fs.existsSync(tempSafeHtml)) fs.unlinkSync(tempSafeHtml);
            return true;
        } else {
            throw new Error("PDF blev ikke oprettet korrekt.");
        }
    } catch (error) {
        if (fs.existsSync(tempSafeHtml)) {
            try { fs.unlinkSync(tempSafeHtml); } catch (e) { /* ignore */ }
        }
        logger.error("printToPdf", "PDF-generering fejlede", { htmlPath, pdfPath }, error);
        return false;
    }
}

module.exports = printToPdf;
