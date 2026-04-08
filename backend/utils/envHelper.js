/**
 * @module Utils/EnvHelper
 * @description Sikrer at .env filen eksisterer, og opretter den fra .env_template hvis den mangler.
 */

const fs = require('fs');
const path = require('path');

/**
 * Tjekker om .env findes. Hvis ikke, kopieres .env_template til .env 
 * med rensede hemmeligheder.
 * @param {string} rootDir - Projektets rodmappe.
 * @param {object} logger - Systemets logger.
 */
function ensureEnvExists(rootDir, logger) {
    const envPath = path.join(rootDir, '.env');
    const templatePath = path.join(rootDir, '.env_template');

    if (fs.existsSync(envPath)) {
        // Filen findes allerede, vi gør intet (vi vil ikke overskrive brugerens nøgler)
        return;
    }

    if (!fs.existsSync(templatePath)) {
        logger.error("EnvHelper", "Kritisk fejl: Hverken .env eller .env_template blev fundet i rodmappen!", { rootDir });
        return;
    }

    try {
        logger.info("EnvHelper", ".env mangler. Genererer en ny baseret på .env_template...");
        
        const content = fs.readFileSync(templatePath, 'utf8');
        fs.writeFileSync(envPath, content);
        
        logger.info("EnvHelper", ".env er nu oprettet. Husk at indsætte dine egne API nøgler i filen.");
    } catch (e) {
        logger.error("EnvHelper", "Fejl under oprettelse af .env fra template", e);
    }
}

module.exports = { ensureEnvExists };
