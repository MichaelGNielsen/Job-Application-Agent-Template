const fs = require('fs');
const path = require('path');

/**
 * Wrapper Markdown indhold i et HTML layout template.
 * @param {string} t - Dokument titel
 * @param {string} c - HTML indhold
 * @param {string} type - 'ansøgning' eller 'cv'
 * @param {object} meta - Virksomhedsdata
 * @param {object} candidate - Kandidatdata
 * @param {string} lang - Sprog (da/en)
 * @param {object} layoutMeta - Overstyring af layout felter
 * @returns {string} - Komplet HTML dokument
 */
const wrap = (t, c, type = 'ansøgning', meta = {}, candidate = {}, lang = 'da', layoutMeta = {}) => {
    const rootDir = '/app/shared';
    let templateFileName = 'master_layout.html';
    if (type.toLowerCase() === 'cv') templateFileName = 'cv_layout.html';
    const templatePath = path.join(rootDir, 'templates', templateFileName);
    let html = fs.readFileSync(templatePath, 'utf8');
    
    const company = meta.company || '';
    const position = meta.position || '';
    
    const name = layoutMeta.senderName || candidate.name || process.env.MIT_NAVN || "Bruger";
    const phone = layoutMeta.senderPhone || candidate.phone || process.env.MIN_TELEFON || "";
    const email = layoutMeta.senderEmail || candidate.email || process.env.MIN_EMAIL || "";
    const address = layoutMeta.senderAddress || candidate.address || process.env.MIN_ADRESSE || "";

    const docTitle = `${t} - ${name} - ${company} - ${position}`.replace(/\s+/g, ' ').trim();
    let dateDisplay = "";
    
    if (type === 'ansøgning') {
        const dateObj = new Date();
        const formattedDate = dateObj.toLocaleDateString(lang === 'en' ? 'en-GB' : 'da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
        const location = layoutMeta.location || (address ? address.split(',')[1]?.trim().replace(/^[0-9 ]+/, '') : "");
        const prefix = layoutMeta.datePrefix !== undefined ? layoutMeta.datePrefix : (lang === 'da' ? "den" : "");
        dateDisplay = prefix ? `${location}, ${prefix} ${formattedDate}` : `${location}, ${formattedDate}`;
    }

    let addressHtml = "";
    const addrParts = address.split(',');
    if (addrParts.length >= 2) {
        const street = addrParts[0].trim();
        const cityInfo = addrParts[1].trim();
        if (dateDisplay) {
            addressHtml = `<p>${street}</p><div class="address-date-line"><span>${cityInfo}</span><span style="margin-left: auto; text-align: right;">${dateDisplay}</span></div>`;
        } else {
            addressHtml = `<p>${street}</p><p>${cityInfo}</p>`;
        }
    } else {
        const fullAddr = address.split(',')[0].trim();
        if (dateDisplay) {
            addressHtml = `<div class="address-date-line"><span>${fullAddr}</span><span style="margin-left: auto; text-align: right;">${dateDisplay}</span></div>`;
        } else {
            addressHtml = `<p>${fullAddr}</p>`;
        }
    }

    let cleanContent = c;
    
    let scoreHtml = "";
    const scoreMatch = cleanContent.match(/\[SCORE\]\s*(.*?)\s*\[\/SCORE\]/i);
    if (scoreMatch) {
        const scoreValue = scoreMatch[1];
        scoreHtml = `<div class="match-score">Samlet Match Score: ${scoreValue}</div>\n`;
        cleanContent = cleanContent.replace(/\[SCORE\][\s\S]*?\[\/SCORE\]/gi, '');
    }

    let resultHtml = html
        .replace(/{{DOC_TITLE}}/g, docTitle)
        .replace(/{{BRUGER_NAVN}}|{{NAME}}/g, name)
        .replace(/{{BRUGER_ADRESSE_BLOK}}|{{ADDRESS_BLOCK}}/g, addressHtml)
        .replace(/{{BRUGER_TLF}}|{{PHONE}}/g, phone)
        .replace(/{{BRUGER_EMAIL}}|{{EMAIL}}/g, email)
        .replace(/{{FIRMA_ADRESSE}}|{{ADDRESS}}/g, (layoutMeta.address || ""))
        .replace(/{{CONTENT}}/g, scoreHtml + cleanContent)
        .replace(/{{SIGNATURE_SECTION}}/g, "");
    
    return resultHtml;
};

module.exports = wrap;
