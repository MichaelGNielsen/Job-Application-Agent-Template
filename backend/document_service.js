const fs = require('fs');
const path = require('path');

/**
 * Document Service (v4.8.0)
 * Håndterer layout wrapping, sektions-ekstraktion, Front Matter parsing og kandidat-info.
 */

const parseFrontMatter = (text) => {
    if (!text) return { attributes: {}, body: "" };
    const res = { attributes: {}, body: text };
    const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (match) {
        const yaml = match[1];
        res.body = match[2].trim();
        const lines = yaml.split('\n');
        lines.forEach(line => {
            const parts = line.split(':');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join(':').trim();
                res.attributes[key] = value;
            }
        });
    }
    return res;
};

const extractSection = (text, tag) => {
    if (!text) return "";
    const cleanTag = tag.replace(/^-+|-+$/g, '').toUpperCase();
    const regex = new RegExp(`---${cleanTag}---([\\s\\S]*?)(?=\\n---[A-Z_]+---|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : "";
};

const parseCandidateInfo = (bruttoCv, logger) => {
    const info = { name: "", address: "", email: "", phone: "" };
    if (!bruttoCv) return info;
    
    if (logger) logger.info("document_service", "Parser kandidat-info fra Brutto-CV");
    
    const cleanValue = (val) => val ? val.replace(/^[\s\*#\-]+|[\s\*#\-]+$/g, '').trim() : "";
    const getName = bruttoCv.match(/(?:Navn|Name)[:\s]+(.*?)(?:\n|$)/i);
    const getAddr = bruttoCv.match(/(?:Adresse|Address)[:\s]+(.*?)(?:\n|$)/i);
    const getEmail = bruttoCv.match(/(?:Email|E-mail)[:\s]+(.*?)(?:\n|$)/i);
    const getPhone = bruttoCv.match(/(?:Telefon|Phone|Mobil|Mobile)[:\s]+(.*?)(?:\n|$)/i);
    
    if (getName) info.name = cleanValue(getName[1]);
    if (getAddr) info.address = cleanValue(getAddr[1]);
    if (getEmail) info.email = cleanValue(getEmail[1]);
    if (getPhone) info.phone = cleanValue(getPhone[1]);
    
    return info;
};

const wrap = (t, c, type = 'ansøgning', meta = {}, candidate = {}, lang = 'da', layoutMeta = {}, logger) => {
    const rootDir = '/app/shared';
    const templatePath = path.join(rootDir, 'templates', type === 'cv' ? 'cv_layout.html' : 'master_layout.html');
    
    if (!fs.existsSync(templatePath)) {
        if (logger) logger.warn("document_service", `Template ikke fundet: ${templatePath}`);
        return c;
    }
    
    let html = fs.readFileSync(templatePath, 'utf8');
    
    if (logger) logger.info("document_service", `Wrapper ${type} i HTML layout`, { title: t });

    const signOff = layoutMeta['Sign-off'] || layoutMeta.signOff || (lang === 'en' ? "Sincerely," : "Med venlig hilsen,");
    const location = layoutMeta['Location'] || layoutMeta.location || "";
    const name = layoutMeta['Sender-Name'] || layoutMeta.senderName || candidate.name || "Michael Guldbæk Nielsen";
    const address = layoutMeta['Sender-Address'] || layoutMeta.senderAddress || candidate.address || "";
    const phone = layoutMeta['Sender-Phone'] || layoutMeta.senderPhone || candidate.phone || "";
    const email = layoutMeta['Sender-Email'] || layoutMeta.senderEmail || candidate.email || "";
    const recipientAddr = layoutMeta['Address'] || layoutMeta.address || "";
    const datePrefix = layoutMeta['Date-Prefix'] || layoutMeta.datePrefix || (lang === 'da' ? "den" : "");

    const today = new Date();
    const formattedDate = today.toLocaleDateString(lang === 'en' ? 'en-GB' : 'da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
    const dateDisplay = `${location}${location ? ', ' : ''}${datePrefix} ${formattedDate}`;

    const replacements = {
        '{{DOC_TITLE}}': t,
        '{{CONTENT}}': (type === 'ansøgning' && recipientAddr ? `<div class="recipient">${recipientAddr.replace(/\n/g, '<br/>')}</div>` : "") + c,
        '{{BRUGER_NAVN}}': name,
        '{{BRUGER_TLF}}': phone,
        '{{BRUGER_EMAIL}}': email,
        '{{SIGN_OFF}}': signOff,
        '{{SIGNATURE_SECTION}}': type === 'ansøgning' ? `<div class="signature"><p>${signOff}</p><br/><p>${name}</p></div>` : "",
        '{{BRUGER_ADRESSE_BLOK}}': `<div class="address-date-line"><span>${address}</span><span>${dateDisplay}</span></div>`
    };

    for (const [key, val] of Object.entries(replacements)) {
        html = html.replace(new RegExp(key, 'g'), val || "");
    }
    return html;
};

const wrapAll = (docs, meta = {}, logger) => {
    const combinedContent = docs.map((doc, idx) => `
        <div class="page-container" style="${idx < docs.length - 1 ? 'page-break-after: always;' : ''}">
            <div class="content">${doc.body}</div>
        </div>
    `).join('');
    return wrap('Internt Materiale', combinedContent, 'internal', {}, {}, 'da', {}, logger);
};

module.exports = { parseFrontMatter, extractSection, parseCandidateInfo, wrap, wrapAll };
