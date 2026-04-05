const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const parseCandidateInfo = require('./parseCandidateInfo');
const mdToHtml = require('./mdToHtml');
const wrap = require('./wrap');
const printToPdf = require('./printToPdf');

/**
 * Genererer alle Master CV dokumenter (Markdown, HTML, PDF).
 * @param {string} mdContent 
 * @returns {Promise<object>}
 */
async function generateMasterDocs(mdContent) {
    const rootDir = '/app/shared';
    const dataDir = path.join(rootDir, 'data');
    const mdPath = path.join(dataDir, 'brutto_cv.md');
    const htmlPath = path.join(dataDir, 'brutto_cv.html');
    const pdfPath = path.join(dataDir, 'brutto_cv.pdf');

    try {
        logger.info("master", "Starter generering af Master CV visning");
        
        if (mdContent) {
            fs.writeFileSync(mdPath, mdContent);
        } else {
            mdContent = fs.readFileSync(mdPath, 'utf8');
        }

        const candidate = parseCandidateInfo(mdContent);
        const htmlBody = await mdToHtml(mdContent, mdPath, "brutto_cv_body.html");
        
        const fullHtml = wrap('Brutto-CV (Master)', htmlBody, 'cv', { company: 'MASTER', position: 'FULL_PROFILE' }, candidate, 'da', {});
        
        fs.writeFileSync(htmlPath, fullHtml);
        logger.info("master", "HTML genereret", { htmlPath });

        const success = await printToPdf(htmlPath, pdfPath);
        if (success) {
            logger.info("master", "PDF genereret succesfuldt", { pdfPath });
        }

        return { success, html: fullHtml };
    } catch (error) {
        logger.error("master", "Fejl ved generering af Master CV", {}, error);
        throw error;
    }
}

module.exports = generateMasterDocs;
