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

// --- AVANCERET LOGGER (v3.2) ---
const chalk = {
    red: (msg) => `\x1b[31m${msg}\x1b[0m`,
    yellow: (msg) => `\x1b[33m${msg}\x1b[0m`,
    green: (msg) => `\x1b[32m${msg}\x1b[0m`,
    cyan: (msg) => `\x1b[36m${msg}\x1b[0m`,
    gray: (msg) => `\x1b[90m${msg}\x1b[0m`,
    magenta: (msg) => `\x1b[35m${msg}\x1b[0m`,
    white: (msg) => `\x1b[37m${msg}\x1b[0m`
};

const logger = {
    getLevel: () => {
        const v = process.env.VERBOSE || "";
        if (v === "-vvvvv") return 5;
        if (v === "-vvvv") return 4;
        if (v === "-vvv") return 3;
        if (v === "-vv") return 2;
        if (v === "-v") return 1;
        return 0;
    },
    getCaller: () => {
        try {
            const stack = new Error().stack.split('\n');
            // Index 3 er selve log-funktionen (info/warn), Index 4 er kaldet til log-funktionen
            const line = stack[3] || '';
            const match = line.match(/\((.*):(\d+):(\d+)\)$/) || line.match(/at (.*):(\d+):(\d+)$/);
            if (match) {
                const file = path.basename(match[1]);
                const lineNum = match[2];
                return `${file}:${lineNum}`;
            }
        } catch (e) {}
        return 'unknown';
    },
    format: (type, funcName, msg, data, levelOverride) => {
        const v = levelOverride !== undefined ? levelOverride : logger.getLevel();
        const ts = new Date().toISOString();
        const caller = logger.getCaller();
        
        // Fast 5-bogstavs prefix for log-niveau
        let prefix = '[INFO]';
        if (type === 'warn') prefix = '[WARNI]';
        if (type === 'error') prefix = '[ERROR]';
        if (type === 'fatal') prefix = '[FATAL]';
        if (type === 'info' && v === 2) prefix = '[DEB1]';
        if (type === 'info' && v === 3) prefix = '[DEB2]';
        if (type === 'info' && v === 4) prefix = '[TRAC]';
        if (type === 'info' && v >= 5) prefix = '[INSA]';
        
        let output = `${prefix} [${ts}] [${funcName}] ${msg}`;
        if (v >= 2) output = `${prefix} [${ts}] [${caller}] [${funcName}] ${msg}`;
        
        if (v >= 3 && data !== undefined) {
            const dataStr = typeof data === 'object' ? JSON.stringify(data) : data;
            if (v === 4 && dataStr.length > 500) {
                output += ` | DATA: ${dataStr.substring(0, 500)}...`;
            } else {
                output += ` | DATA: ${dataStr}`;
            }
        }
        return output;
    },
    info: (func, msg, data) => {
        if (logger.getLevel() >= 1) console.log(chalk.green(logger.format('info', func, msg, data)));
    },
    warn: (func, msg, data) => {
        console.warn(chalk.yellow(logger.format('warn', func, msg, data, 5)));
    },
    error: (func, msg, data, err) => {
        let line = logger.format('error', func, msg, data, 5);
        if (err) line += ` | ERROR: ${err.message || err}`;
        console.error(chalk.red(line));
    },
    assert: (cond, func, msg, data) => {
        if (!cond) {
            let line = logger.format('fatal', func, `ASSERT FAILED: ${msg}`, data, 5);
            console.error(chalk.red(line));
        }
    }
};

const mdToHtml = async (md, filePath, outputFileName) => {
    if (!md) return "";

    try {
        const outputPath = path.join(path.dirname(filePath), outputFileName);
        fs.writeFileSync(filePath, md);
        logger.debug(`Konverterer Markdown til HTML: ${outputFileName}`);

        // Vi tilføjer '--smart' med minus foran for at DEAKTIVERE det i visse Pandoc versioner,
        const cmd = `pandoc -f gfm-smart -t html --wrap=none -o "${outputPath}" "${filePath}"`;
        logger.debug(`Pandoc kommando: ${cmd}`);
        await execPromise(cmd);

        return fs.readFileSync(outputPath, 'utf8');
    } catch (e) {
        logger.error("Pandoc fejlede!", e.message);
        // Minimal fallback der bare laver linjeskift hvis alt andet fejler
        return `<div class="md-content"><p>${md.replace(/\n/g, '<br>')}</p></div>`;
    }
};


const wrap = (t, c, type = 'ansøgning', meta = {}, candidate = {}, lang = 'dk', layoutMeta = {}) => {
    logger.info('wrap', `Wrapper dokument: ${type} (${t})`, { type, lang });
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
        logger.info(`Henter firma-indhold fra: ${url}`);
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

        logger.verbose(`Fandt titel: "${title}" og beskrivelse (${description.length} tegn)`);
        logger.debug(`Rå tekst udtrukket (${bodyText.length} tegn)`);

        return `TITEL: ${title}\nBESKRIVELSE: ${description}\nUDDRAG FRA SIDE: ${bodyText}`;
    } catch (e) {
        logger.warn(`Kunne ikke hente URL (${url}): ${e.message}`);
        return "";
    }
}

module.exports = { mdToHtml, wrap, wrapAll, fetchCompanyContent, logger };
