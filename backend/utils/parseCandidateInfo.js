const logger = require('./logger');

/**
 * Udtrækker stamdata (Navn, Adresse, Email, Tlf) fra Brutto-CV.
 * @param {string} bruttoCv 
 * @returns {object}
 */
function parseCandidateInfo(bruttoCv) {
    const info = { name: "", address: "", email: "", phone: "" };
    if (!bruttoCv) return info;

    logger.info("parseCandidateInfo", "Parser kandidat-info fra Brutto-CV");
    const cleanValue = (val) => val ? val.replace(/^[\s\*\-#]+|[\s\*\-#]+$/g, '').trim() : "";

    const getName = bruttoCv.match(/(?:\*\*|\*|#|-)?\s*(?:Navn|Name)[:\s]+(.*?)(?:\n|$)/i);
    const getAddr = bruttoCv.match(/(?:\*\*|\*|#|-)?\s*(?:Adresse|Address)[:\s]+(.*?)(?:\n|$)/i);
    const getEmail = bruttoCv.match(/(?:\*\*|\*|#|-)?\s*(?:Email|E-mail)[:\s]+(.*?)(?:\n|$)/i);
    const getPhone = bruttoCv.match(/(?:\*\*|\*|#|-)?\s*(?:Telefon|Phone|Mobil|Mobile)[:\s]+(.*?)(?:\n|$)/i);

    if (getName) info.name = cleanValue(getName[1]);
    if (getAddr) info.address = cleanValue(getAddr[1]);
    if (getEmail) info.email = cleanValue(getEmail[1]);
    if (getPhone) info.phone = cleanValue(getPhone[1]);
    
    logger.info("parseCandidateInfo", "Kandidat-data udtrukket", info);
    return info;
}

module.exports = parseCandidateInfo;
