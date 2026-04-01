const fs = require('fs');
const path = require('path');
const { mdToHtml, printToPdf } = require('./pdf_service');
const { parseCandidateInfo, wrap } = require('./document_service');

/**
 * Master CV Service (v4.8.0)
 * Genererer HTML og PDF for Master CV i data-mappen.
 */
async function generateMasterDocs(mdContent, logger) {
    const rootDir = '/app/shared';
    const dataDir = path.join(rootDir, 'data');
    const mdPath = path.join(dataDir, 'brutto_cv.md');
    const htmlPath = path.join(dataDir, 'brutto_cv.html');
    const pdfPath = path.join(dataDir, 'brutto_cv.pdf');

    try {
        if (logger) logger.info("master_cv_service", "Starter generering af Master CV visning");

        // Gem MD hvis indholdet er medsendt (valgfrit)
        if (mdContent) {
            fs.writeFileSync(mdPath, mdContent);
        } else {
            mdContent = fs.readFileSync(mdPath, 'utf8');
        }

        const candidate = parseCandidateInfo(mdContent, logger);

        // --- SMART SPLIT (v4.3.5) ---
        let displayMd = mdContent;
        if (mdContent.includes('---')) {
            displayMd = mdContent.split('---').slice(1).join('---').trim();
        }

        const bodyMdPath = path.join(dataDir, "brutto_cv_body_tmp.md");
        const htmlBody = await mdToHtml(displayMd, bodyMdPath, "brutto_cv_body.html", logger);
        if (fs.existsSync(bodyMdPath)) fs.unlinkSync(bodyMdPath);

        const fullHtml = wrap('Brutto-CV (Master)', htmlBody, 'cv', { company: 'MASTER', position: 'FULL_PROFILE' }, candidate, 'da', {}, logger);

        fs.writeFileSync(htmlPath, fullHtml);
        if (logger) logger.info("master_cv_service", "HTML genereret", { htmlPath });

        const success = await printToPdf(htmlPath, pdfPath, logger);
        if (success && logger) {
            logger.info("master_cv_service", "PDF genereret succesfuldt", { pdfPath });
        }

        return { success, html: fullHtml };
    } catch (error) {
        if (logger) logger.error("master_cv_service", "Fejl ved generering af Master CV", {}, error);
        throw error;
    }
}

module.exports = { generateMasterDocs };
