const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const execPromise = promisify(exec);

// --- AVANCERET LOGGER (v3.5.1) ---
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
        const v = (process.env.VERBOSE || "").toLowerCase();
        if (!v.startsWith("-v")) return 0;
        const count = (v.match(/v/g) || []).length;
        return Math.min(count, 2);
    },
    getCaller: () => {
        try {
            const stack = new Error().stack.split('\n');
            const line = stack[3] || '';
            const match = line.match(/\((.*):(\d+):(\d+)\)$/) || line.match(/at (.*):(\d+):(\d+)$/);
            if (match) {
                return { file: path.basename(match[1]), line: match[2] };
            }
        } catch (e) {}
        return { file: 'unknown', line: '0' };
    },
    pad: (str, len, char = ' ') => {
        if (!str) str = "";
        if (str.length > len) return str.substring(0, len);
        return str.padEnd(len, char);
    },
    format: (type, funcName, msg, data, levelOverride) => {
        const v = levelOverride !== undefined ? levelOverride : logger.getLevel();
        const ts = new Date().toISOString();
        const caller = logger.getCaller();
        let levelLabel = 'INFO0';
        if (type === 'warn')  levelLabel = 'WARNI';
        else if (type === 'error') levelLabel = 'ERROR';
        else if (type === 'fatal') levelLabel = 'FATAL';
        else {
            if (v === 1) levelLabel = 'INFO1';
            if (v >= 2) levelLabel = 'INFO2';
        }
        const fTS = `[${ts}]`;
        const fLVL = `[${levelLabel}]`;
        const fLine = `[${caller.line.padStart(5, '0')}]`;
        const fFunc = `[${logger.pad(funcName, 15)}]`;
        const fFile = `[${logger.pad(caller.file, 12)}]`;
        let output = `${fTS}${fLVL}${fLine}${fFunc}${fFile} - ${msg}`;
        if (v >= 1 && data !== undefined) {
            const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
            if (v === 1 && dataStr.length > 500) output += ` | DATA: ${dataStr.substring(0, 500)}... (truncated)`;
            else output += ` | DATA: ${dataStr}`;
        }
        return output;
    },
    info: (func, msg, data) => {
        const level = logger.getLevel();
        let colorFunc = chalk.green;
        if (level === 1) colorFunc = chalk.cyan;
        if (level >= 2) colorFunc = chalk.magenta;
        console.log(colorFunc(logger.format('info', func, msg, data)));
    },
    warn: (func, msg, data) => {
        console.warn(chalk.yellow(logger.format('warn', func, msg, data, 2)));
    },
    error: (func, msg, data, err) => {
        let line = logger.format('error', func, msg, data, 2);
        if (err) line += ` | ERROR: ${err.message || err}`;
        console.error(chalk.red(line));
    },
    assert: (cond, func, msg, data) => {
        if (!cond) {
            let line = logger.format('fatal', func, `ASSERT FAILED: ${msg}`, data, 2);
            console.error(chalk.red(line));
        }
    }
};

// --- ROBUST PDF GENERERING (v3.5.1) ---
async function printToPdf(htmlPath, pdfPath) {
    const tempSafeHtml = path.join(path.dirname(htmlPath), `print_tmp_${Date.now()}.html`);
    try {
        // 1. Kopier til et sikkert filnavn uden specialtegn for at undgå shell/encoding fejl
        fs.copyFileSync(htmlPath, tempSafeHtml);
        
        // 2. Kør Chromium mod den sikre temp-fil
        const cmd = `chromium-browser --headless --disable-gpu --no-sandbox --no-pdf-header-footer --print-to-pdf="${pdfPath}" "file://${tempSafeHtml}"`;
        logger.info("printToPdf", "Genererer PDF", { cmd });
        await execPromise(cmd);
        
        // 3. Ryd op
        if (fs.existsSync(tempSafeHtml)) fs.unlinkSync(tempSafeHtml);
        return true;
    } catch (error) {
        if (fs.existsSync(tempSafeHtml)) fs.unlinkSync(tempSafeHtml);
        logger.error("printToPdf", "PDF-generering fejlede", { htmlPath, pdfPath }, error);
        return false;
    }
}

const mdToHtml = async (md, filePath, outputFileName) => {
    if (!md) return "";
    try {
        const outputPath = path.join(path.dirname(filePath), outputFileName);
        fs.writeFileSync(filePath, md);
        logger.info("mdToHtml", `Konverterer Markdown til HTML: ${outputFileName}`);
        const cmd = `pandoc -f gfm-smart -t html --wrap=none -o "${outputPath}" "${filePath}"`;
        await execPromise(cmd);
        return fs.readFileSync(outputPath, 'utf8');
    } catch (e) {
        logger.error("mdToHtml", "Pandoc fejlede", { mdStørrelse: md.length }, e);
        return `<div class="md-content"><p>${md.replace(/\n/g, '<br>')}</p></div>`;
    }
};

const wrap = (t, c, type = 'ansøgning', meta = {}, candidate = {}, lang = 'da', layoutMeta = {}) => {
    const rootDir = '/app/shared';
    let templateFileName = 'master_layout.html';
    if (type.toLowerCase() === 'cv') templateFileName = 'cv_layout.html';
    const templatePath = path.join(rootDir, 'templates', templateFileName);
    let html = fs.readFileSync(templatePath, 'utf8');
    const company = meta.company || '';
    const position = meta.position || '';
    
    // Prioriter Sender-data fra metadata (så brugeren kan rette dem i editoren)
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
        const fullAddr = addrParts[0].trim();
        if (dateDisplay) {
            addressHtml = `<div class="address-date-line"><span>${fullAddr}</span><span style="margin-left: auto; text-align: right;">${dateDisplay}</span></div>`;
        } else {
            addressHtml = `<p>${fullAddr}</p>`;
        }
    }

    // --- JANITOR FASE (v3.6.7) ---
    // Vi fjerner tekniske metadata og sektions-tags fra det indhold, der skal i PDF'en.
    let cleanContent = c;
    // Fjern alt mellem ---LAYOUT_METADATA--- og det næste sektions-tag eller slutningen af strengen
    cleanContent = cleanContent.replace(/---LAYOUT_METADATA---[\s\S]*?(?=---[A-ZÆØÅ_]+---|$)/gi, '');
    // Fjern alle sektions-tags (f.eks. ---ANSØGNING---)
    cleanContent = cleanContent.replace(/---[A-ZÆØÅ_]+---/gi, '');
    
    let resultHtml = html
        .replace(/{{DOC_TITLE}}/g, docTitle)
        .replace(/{{NAME}}/g, name)
        .replace(/{{ADDRESS_BLOCK}}/g, addressHtml)
        .replace(/{{ADDRESS}}/g, (layoutMeta.address || "")) // Firma-adressen (modtager)
        .replace(/{{PHONE}}/g, phone)
        .replace(/{{EMAIL}}/g, email)
        .replace(/{{CONTENT}}/g, cleanContent.replace(/\[SCORE\]\s*(.*?)\s*\[\/SCORE\]/gi, '<div class="match-score">Samlet Match Score: $1</div>'))
        .replace(/{{SIGNATURE_SECTION}}/g, "");
    return resultHtml;
};

const wrapAll = (docs, meta = {}) => {
    const combinedContent = docs.map((doc, idx) => `
        <div class="page-container" style="${idx < docs.length - 1 ? 'page-break-after: always;' : ''}">
            <div class="content">${doc.body}</div>
        </div>
    `).join('');
    return wrap('Internt Materiale', combinedContent, 'internal', meta);
};

async function fetchCompanyContent(url) {
    if (!url) return "";
    try {
        logger.info("fetchCompanyContent", `Henter indhold fra: ${url}`);
        const { data } = await axios.get(url, { 
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const $ = cheerio.load(data);
        $('script, style, nav, footer, header').remove();
        const title = $('title').text().trim();
        const description = $('meta[name="description"]').attr('content') || "";
        let bodyText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 1500);
        logger.info("fetchCompanyContent", `Fandt titel: "${title}"`);
        return `TITEL: ${title}\nBESKRIVELSE: ${description}\nUDDRAG FRA SIDE: ${bodyText}`;
    } catch (e) {
        logger.warn("fetchCompanyContent", `Kunne ikke hente URL (${url}): ${e.message}`);
        return "";
    }
}

module.exports = { mdToHtml, wrap, wrapAll, fetchCompanyContent, logger, printToPdf };
