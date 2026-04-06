const cheerio = require('cheerio');
const { exec } = require('child_process');
const { promisify } = require('util');
const logger = require('./logger');

const execPromise = promisify(exec);

/**
 * Henter og scraper tekst-indhold fra en virksomheds-URL via headless Chromium.
 * Dette sikrer at JavaScript eksekveres og indhold bag cookie-mure ofte bliver synligt.
 * @param {string} url 
 * @returns {Promise<string>}
 */
async function fetchCompanyContent(url) {
    if (!url) return "";
    try {
        logger.info("fetchCompanyContent", `Henter indhold via Chromium: ${url}`);
        
        // Vi bruger --dump-dom for at få den færdig-renderede HTML efter JS kørsel
        // Vi tilføjer en hård timeout på 20 sekunder for at undgå at processen hænger
        const cmd = `chromium-browser --headless --disable-gpu --no-sandbox --dump-dom --virtual-time-budget=5000 "${url}"`;
        const { stdout } = await execPromise(cmd, { 
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer
            timeout: 20000,              // 20 sekunder timeout
            killSignal: 'SIGKILL'        // Tvungen afslutning ved timeout
        });
        
        if (!stdout) throw new Error("Ingen HTML modtaget fra Chromium");

        const $ = cheerio.load(stdout);

        // Rens siden for unødvendige elementer
        $('script, style, nav, footer, header, .cookie-banner, #cookie-information-template-wrapper').remove();
        
        const title = $('title').text().trim();
        const description = $('meta[name="description"]').attr('content') || "";
        
        // Forsøg at finde den primære tekst-blok (ofte i <main> eller <article>)
        let bodyText = $('main, article, #content, .content').text().replace(/\s+/g, ' ').trim();
        
        // Fallback til hele body hvis ingen af ovenstående findes
        if (bodyText.length < 200) {
            bodyText = $('body').text().replace(/\s+/g, ' ').trim();
        }

        logger.info("fetchCompanyContent", `Fandt titel: "${title}" | Tekst-længde: ${bodyText.length}`);
        
        return `TITEL: ${title}\nBESKRIVELSE: ${description}\nUDDRAG FRA SIDE:\n${bodyText.substring(0, 5000)}`;
    } catch (e) {
        logger.warn("fetchCompanyContent", `Kunne ikke hente URL via Chromium (${url}): ${e.message}`);
        return "";
    }
}

module.exports = fetchCompanyContent;
