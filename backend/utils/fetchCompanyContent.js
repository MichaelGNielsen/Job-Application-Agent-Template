const cheerio = require('cheerio');
const logger = require('./logger');

/**
 * Henter og scraper tekst-indhold fra en virksomheds-URL.
 * @param {string} url 
 * @returns {Promise<string>}
 */
async function fetchCompanyContent(url) {
    if (!url) return "";
    try {
        logger.info("fetchCompanyContent", `Henter indhold fra: ${url}`);
        const response = await fetch(url, {
            signal: AbortSignal.timeout(5000),
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        if (!response.ok) throw new Error(`HTTP fejl status: ${response.status}`);
        const data = await response.text();
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

module.exports = fetchCompanyContent;
