const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

/**
 * PDF Service (v4.8.0)
 * Håndterer konvertering fra Markdown til HTML og HTML til PDF.
 */

const mdToHtml = async (md, filePath, outputFileName, logger) => {
    if (!md) return "";
    try {
        const outputPath = path.join(path.dirname(filePath), outputFileName);
        fs.writeFileSync(filePath, md);
        
        if (logger) logger.info("pdf_service", `Konverterer MD til HTML: ${outputFileName}`);
        
        const cmd = `pandoc -f gfm-smart -t html --wrap=none -o "${outputPath}" "${filePath}"`;
        await execPromise(cmd);
        return fs.readFileSync(outputPath, 'utf8');
    } catch (e) {
        if (logger) logger.error("pdf_service", "Fejl ved pandoc konvertering", {}, e);
        return `<div class="md-content"><p>${md.replace(/\n/g, '<br>')}</p></div>`;
    }
};

async function printToPdf(htmlPath, pdfPath, logger) {
    const tempSafeHtml = path.join(path.dirname(htmlPath), `print_tmp_${Date.now()}.html`);
    try {
        fs.copyFileSync(htmlPath, tempSafeHtml);
        
        if (logger) logger.info("pdf_service", `Genererer PDF: ${path.basename(pdfPath)}`);
        
        const cmd = `chromium-browser --headless --disable-gpu --no-sandbox --no-pdf-header-footer --print-to-pdf="${pdfPath}" "file://${tempSafeHtml}"`;
        await execPromise(cmd);
        
        if (fs.existsSync(tempSafeHtml)) fs.unlinkSync(tempSafeHtml);
        return true;
    } catch (error) {
        if (logger) logger.error("pdf_service", "Fejl ved PDF generering", {}, error);
        if (fs.existsSync(tempSafeHtml)) fs.unlinkSync(tempSafeHtml);
        return false;
    }
}

module.exports = { mdToHtml, printToPdf };
