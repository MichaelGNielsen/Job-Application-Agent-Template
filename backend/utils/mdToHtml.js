const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const execPromise = promisify(exec);

/**
 * Konverterer Markdown til HTML ved hjælp af Pandoc.
 * @param {string} md 
 * @param {string} filePath 
 * @param {string} outputFileName 
 * @returns {Promise<string>}
 */
const mdToHtml = async (md, filePath, outputFileName) => {
    if (!md) return "";
    try {
        const safeFilePath = filePath || path.join('/tmp', `temp_${Date.now()}.md`);
        const safeOutputFileName = outputFileName || `temp_${Date.now()}.html`;
        const outputPath = path.join(path.dirname(safeFilePath), safeOutputFileName);
        
        fs.writeFileSync(safeFilePath, md);
        logger.info("mdToHtml", `Konverterer Markdown til HTML: ${safeOutputFileName}`);
        const cmd = `pandoc -f gfm-smart -t html --wrap=none -o "${outputPath}" "${safeFilePath}"`;
        await execPromise(cmd);
        const result = fs.readFileSync(outputPath, 'utf8');
        
        if (!filePath && fs.existsSync(safeFilePath)) fs.unlinkSync(safeFilePath);
        if (!outputFileName && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        
        return result;
    } catch (e) {
        logger.error("mdToHtml", "Pandoc fejlede", { mdStørrelse: md.length }, e);
        return `<div class="md-content"><p>${md.replace(/\n/g, '<br>')}</p></div>`;
    }
};

module.exports = mdToHtml;
