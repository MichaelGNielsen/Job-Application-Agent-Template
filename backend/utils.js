/**
 * Job Application Agent Template
 * 
 * Designer: MGN (mgn@mgnielsen.dk)
 * Copyright (c) 2026 MGN. All rights reserved.
 * 
 * BEMÆRK: Denne kode anvender AI til generering og behandling.
 * Brugeren skal selv verificere, at resultatet er som forventet.
 * Softwaren leveres "som den er", uden nogen form for garanti.
 * Brug af softwaren sker på eget ansvar.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const execPromise = promisify(exec);

const mdToHtml = async (md, filePath, outputFileName) => {
    if (!md) return "";

    try {
        const outputPath = path.join(path.dirname(filePath), outputFileName);
        fs.writeFileSync(filePath, md);

        // Vi tilføjer '--smart' med minus foran for at DEAKTIVERE det i visse Pandoc versioner,
        // eller vi bruger '-smart' (uden plus) for at sikre at vi får almindelige tegn.
        const cmd = `pandoc -f gfm-smart -t html --wrap=none -o "${outputPath}" "${filePath}"`;
        await execPromise(cmd);

        return fs.readFileSync(outputPath, 'utf8');
    } catch (e) {
        console.error("Pandoc fejlede!", e.message);
        // Minimal fallback der bare laver linjeskift hvis alt andet fejler
        return `<div class="md-content"><p>${cleanedMd.replace(/\n/g, '<br>')}</p></div>`;
    }
};


const wrap = (t, c, type = 'ansøgning', meta = {}, candidate = {}, lang = 'dk', layoutMeta = {}) => {
    // Brug /app/shared/templates hvis vi er i Docker, ellers brug relativ sti
    const rootDir = '/app/shared';
    
    // Bestem hvilken template der skal bruges
    let templateFileName = 'master_layout.html';
    if (type.toLowerCase() === 'cv') {
        templateFileName = 'cv_layout.html';
    }

    const templatePath = path.join(rootDir, 'templates', templateFileName);
    
    let html = fs.readFileSync(templatePath, 'utf8');

    const company = meta.company || '';
    const position = meta.position || '';
    const name = candidate.name || process.env.MIT_NAVN || "Bruger";
    const docTitle = `${t} - ${name} - ${company} - ${position}`.replace(/\s+/g, ' ').trim();

    // Signatur sektion håndteres nu direkte af AI i Markdown for fuld kontrol
    let signatureSection = "";

    // Dato og Lokation (KUN til ansøgning)
    let dateDisplay = "";
    if (type === 'ansøgning') {
        const dateObj = new Date();
        const formattedDate = dateObj.toLocaleDateString(lang === 'en' ? 'en-GB' : lang, { day: 'numeric', month: 'long', year: 'numeric' });
        
        const location = layoutMeta.location || (candidate.address ? candidate.address.split(',')[1]?.trim().replace(/^[0-9 ]+/, '') : "");
        const prefix = layoutMeta.datePrefix !== undefined ? layoutMeta.datePrefix : (lang === 'da' ? "den" : "");
        
        dateDisplay = prefix ? `${location}, ${prefix} ${formattedDate}` : `${location}, ${formattedDate}`;
    }

    // Split adresse i to linjer
    let addressHtml = "";
    const addrParts = (layoutMeta.address || candidate.address || process.env.MIN_ADRESSE || "").split(',');
    
    if (addrParts.length >= 2) {
        const street = addrParts[0].trim();
        const cityInfo = addrParts[1].trim();
        if (dateDisplay) {
            // Ansøgning layout: Vej på linje 1, By + Dato (højrestillet via flex) på linje 2
            addressHtml = `<p>${street}</p><div class="address-date-line"><span>${cityInfo}</span><span style="margin-left: auto; text-align: right;">${dateDisplay}</span></div>`;
        } else {
            // CV layout: Kun Vej og By (ingen dato, ingen separator)
            addressHtml = `<p>${street}</p><p>${cityInfo}</p>`;
        }
    } else {
        const fullAddr = addrParts[0].trim();
        if (dateDisplay) {
            addressHtml = `<div class="address-date-line"><span>${fullAddr}</span><span style="margin-left: auto; text-align: right;">${dateDisplay}</span></div>`;
        } else {
            addressHtml = `<p>${fullAddr}</p>`;
        }
    }

    // Erstat placeholders
    let resultHtml = html
        .replace(/{{DOC_TITLE}}/g, docTitle)
        .replace(/{{NAME}}/g, name)
        .replace(/{{ADDRESS_BLOCK}}/g, addressHtml)
        .replace(/{{ADDRESS}}/g, (layoutMeta.address || candidate.address || ""))
        .replace(/{{PHONE}}/g, candidate.phone || process.env.MIN_TELEFON || "")
        .replace(/{{EMAIL}}/g, candidate.email || process.env.MIN_EMAIL || "")
        .replace(/{{CONTENT}}/g, c.replace(/\[SCORE\]\s*(.*?)\s*\[\/SCORE\]/gi, '<div class="match-score">Samlet Match Score: $1</div>'))
        .replace(/{{SIGNATURE_SECTION}}/g, signatureSection);

    return resultHtml;
};

const wrapAll = (docs, meta = {}) => {
    // Vi beholder denne til internt materiale
    const combinedContent = docs.map((doc, idx) => `
        <div class="page-container" style="${idx < docs.length - 1 ? 'page-break-after: always;' : ''}">
            <div class="content">${doc.body}</div>
        </div>
    `).join('');

    return wrap('Internt Materiale', combinedContent, 'internal', meta);
};

// --- RESEARCH FUNKTIONER ---
async function fetchCompanyContent(url) {
    if (!url) return "";
    try {
        console.log(`[Research] Henter indhold fra: ${url}`);
        const { data } = await axios.get(url, { 
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const $ = cheerio.load(data);

        // Fjern støj (scripts, styles)
        $('script, style, nav, footer, header').remove();

        const title = $('title').text().trim();
        const description = $('meta[name="description"]').attr('content') || "";
        
        // Hent de første 1500 tegn fra brødteksten for at få en idé om firmaet
        let bodyText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 1500);

        return `TITEL: ${title}\nBESKRIVELSE: ${description}\nUDDRAG FRA SIDE: ${bodyText}`;
    } catch (e) {
        console.warn(`[Research] Kunne ikke hente URL (${url}): ${e.message}`);
        return "";
    }
}

module.exports = { mdToHtml, wrap, wrapAll, fetchCompanyContent };
