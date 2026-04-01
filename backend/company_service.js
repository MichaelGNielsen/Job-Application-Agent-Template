const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

/**
 * Company Service (v4.8.0)
 * Håndterer research og indhentning af data om virksomheder.
 */

const fetchCompanyContent = async (url, logger) => {
    if (!url || !url.startsWith('http')) return "";
    try {
        if (logger) logger.info("company_service", `Henter indhold fra: ${url}`);
        // Vi bruger curl da det er præinstalleret i backenden (v4.3.9 oprydning)
        const { stdout } = await execPromise(`curl -sL "${url}" | head -c 5000`);
        return stdout;
    } catch (e) { 
        if (logger) logger.warn("company_service", `Kunne ikke hente URL: ${url}`, { error: e.message });
        return ""; 
    }
};

module.exports = { fetchCompanyContent };
