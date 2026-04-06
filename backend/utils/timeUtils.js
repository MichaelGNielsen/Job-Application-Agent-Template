/**
 * @module Utils/Time
 * @description Håndterer generering af korrekte tidsstempler baseret på den lokale tidszone (TZ=Europe/Copenhagen).
 */

/**
 * Returnerer et ISO-lignende tidsstempel (YYYY-MM-DDTHH:mm:ss.SSS) i lokal tid.
 * Den indbyggede .toISOString() returnerer altid UTC (Z), hvilket kan være forvirrende i logs.
 * Denne funktion justerer for tidszonen (f.eks. CEST) for at vise den korrekte lokale tid.
 * @returns {string}
 */
const getLocalISOTime = () => {
    const date = new Date();
    // Få fat i det lokale offset i minutter (f.eks. -120 for CEST) og konverter til millisekunder
    const tzOffsetMs = date.getTimezoneOffset() * 60000;
    // Træk offsettet fra for at "snyde" Date-objektet til at repræsentere vores lokale tid i UTC-format
    const localISOTime = new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, -1);
    return localISOTime;
};

/**
 * Returnerer et fil-sikkert tidsstempel (YYYY-MM-DD-HH-mm-ss) i lokal tid til mappenavne.
 * @returns {string}
 */
const getFileSafeTimestamp = () => {
    return getLocalISOTime().replace(/T/, '-').replace(/\..+/, '').replace(/:/g, '-');
};

module.exports = {
    getLocalISOTime,
    getFileSafeTimestamp
};