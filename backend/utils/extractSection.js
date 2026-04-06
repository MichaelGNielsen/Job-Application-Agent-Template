/**
 * Udtrækker en specifik sektion fra AI genereret tekst baseret på tags.
 * @param {string} text 
 * @param {string} tag 
 * @returns {string}
 */
const extractSection = (text, tag) => {
    if (!text) return "";
    const cleanTag = tag.replace(/^-+|-+$/g, '').toUpperCase();
    
    // Forbedret regex: Kræv mindst 3 bindestreger for at identificere en sektion (undgår match på punktlister som '- og')
    const regex = new RegExp(`-{3,}\\s*${cleanTag}\\s*-*[\\s\\S]*?\\n?([\\s\\S]*?)(?=\\n\\s*-{3,}[A-ZÆØÅ_]+\\s*-*|$|\\n=)`, 'i');
    const match = text.match(regex);
    if (!match) {
        const fallbackRegex = new RegExp(`(?:^|\\n)${cleanTag}:?\\s*\\n?([\\s\\S]*?)(?=\\n[A-ZÆØÅ_]+:|$)`, 'i');
        const fallbackMatch = text.match(fallbackRegex);
        return fallbackMatch ? fallbackMatch[1].trim() : "";
    }
    return match[1].trim();
};

module.exports = extractSection;
